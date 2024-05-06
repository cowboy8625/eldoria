// TODO:
// On connection user should supply username and password otherwise Create command should be used
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader, WriteHalf},
    net::{TcpListener, TcpStream},
    sync::{broadcast, Mutex},
};

type PlayerList = Arc<Mutex<HashMap<SocketAddr, Player>>>;

pub async fn run(host: &str, port: &str) -> Result<()> {
    let Ok(adder) = format!("{host}:{port}").parse::<std::net::SocketAddr>() else {
        eprintln!("Failed to parse address: {host}:{port}");
        return Ok(());
    };
    let listener = TcpListener::bind(adder).await.unwrap();
    let (tx, _rx) = broadcast::channel(10);
    let players_list: PlayerList = Arc::new(Mutex::new(HashMap::new()));
    loop {
        let Ok((mut socket, addr)) = listener.accept().await else {
            continue;
        };

        let players_list = players_list.clone();

        let tx = tx.clone();
        let mut rx = tx.subscribe();

        tokio::spawn(async move {
            let (reader, mut writer) = socket.split();

            let mut state = {
                let data = players_list.lock().await;
                if data.contains_key(&addr) {
                    State::Connected
                } else {
                    State::Create
                }
            };

            loop {
                let mut buf = Vec::new();
                let Ok(_) = reader.readable().await else {
                    continue;
                };

                let Ok(_) = reader.try_read_buf(&mut buf) else {
                    continue;
                };

                let Ok(data) = bincode::deserialize::<CommandType>(&buf) else {
                    return;
                };
                tx.send(Command {
                    socket: addr,
                    command: CommandType::Echo(format!("received: {:?}", data.clone())),
                })
                .unwrap();
                match &mut state {
                    State::Create => match data.clone() {
                        CommandType::Login { username, password } => {
                            let Some(user) = lookup_player(&username, &password) else {
                                let command = CommandType::Error(ServerError::InvalidCredentials);
                                let Ok(data) = bincode::serialize(&command) else {
                                    return;
                                };
                                let _ = writer.write_all(&data).await;
                                return;
                            };
                            let Ok(data) = bincode::serialize(&CommandType::LoggedIn(user)) else {
                                return;
                            };
                            let _ = writer.write_all(&data).await;
                            state = State::Connected;
                        }
                        CommandType::Create { .. } => {
                            tx.send(Command {
                                socket: addr,
                                command: CommandType::Echo(format!("invalid command: {data:?}")),
                            })
                            .unwrap();
                        }
                        _ => {
                            let command = CommandType::Echo(format!("invalid command: {data:?}"));
                            let Ok(data) = bincode::serialize(&command) else {
                                return;
                            };
                            let _ = writer.write_all(&data).await;
                        } // if result.unwrap_or_default() == 0 {
                          //     continue;
                          // }
                          // let name = line.trim().to_string();
                          // eprintln!("name: {}", name);
                          // players_list.lock().await.insert(addr, Player { name });
                          // line.clear();
                          // state = State::Connected;
                    },
                    State::Connected => {
                        // if result.unwrap_or_default() == 0 {
                        //     break;
                        // }
                        // match line.trim() {
                        //     "online" => {
                        //         tx.send(Command{socket: addr, command: CommandType::WhosOnline}).unwrap();
                        //     }
                        //     msg => {
                        //         let name = players_list.lock().await.get(&addr).unwrap().name.clone();
                        //         tx.send(Command{socket: addr, command: CommandType::Message{name, msg: msg.into()}}).unwrap();
                        //     }
                        // }
                        // line.clear();
                    }
                }

                tokio::select! {
                    // Handle Commands that come from other players
                    result = rx.recv() => {
                        let Ok(Command{socket, command}) = result else {
                            return;
                        };
                        match command {
                            CommandType::WhosOnline if socket == addr => {
                                let data = players_list.lock().await;
                                let pl = data
                                    .iter()
                                    .filter(|(o,_)| o.to_string() != addr.to_string())
                                    .map(|(_, Player {name})| name.clone())
                                    .collect::<Vec<_>>()
                                    .join(",\r\n") + "\r\n";

                                let msg = CommandType::Echo(pl);

                                let Ok(data) = bincode::serialize(&msg) else {
                                    eprintln!("failed to serialize message {:?}", msg);
                                    return;
                                };
                                match writer.write_all(&data).await {
                                    Ok(_) => {},
                                    Err(_) => {},
                                };
                            },
                            msg @ CommandType::Message{..} => {
                                if socket != addr {
                                    // let Ok(data) = serde_json::to_string(&msg) else {
                                    //     eprintln!("failed to serialize message {:?}", msg);
                                    //     continue;
                                    // };
                                    let Ok(data) = bincode::serialize(&msg) else {
                                        eprintln!("failed to serialize message {:?}", msg);
                                        return;
                                    };
                                    match writer.write_all(&data).await {
                                        Ok(_) => {},
                                        Err(_) => {},
                                    };
                                }
                            }

                            msg @ CommandType::Echo(_) if socket == addr => {
                                    let Ok(data) = bincode::serialize(&msg) else {
                                        eprintln!("failed to serialize message {:?}", msg);
                                        return;
                                    };
                                    match writer.write_all(&data).await {
                                        Ok(_) => {},
                                        Err(_) => {},
                                    };
                            }
                            _ => {
                                eprintln!("state: {:?} cmd: {:?} addr: {:?}", state, command, addr);
                            },
                        }
                    }
                    // Handle State changes
                }
            }
        });
    }
}

fn lookup_player(username: &str, password: &str) -> Option<User> {
    if username == "admin" && password == "admin" {
        Some(User {
            username: "admin".to_string(),
            privlege: Privilege::Admin,
            player: Player {
                name: "admin dude".to_string(),
            },
        })
    } else if username == "username" && password == "password" {
        Some(User {
            username: "user".to_string(),
            privlege: Privilege::User,
            player: Player {
                name: "user guy".to_string(),
            },
        })
    } else {
        None
    }
}

#[derive(Debug)]
enum State {
    Create,
    Connected,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct Command {
    socket: SocketAddr,
    command: CommandType,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CommandType {
    Login { username: String, password: String },
    LoggedIn(User),
    Create { username: String, password: String },
    WhosOnline,
    Message { name: String, msg: String },
    Echo(String),
    Error(ServerError),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ServerError {
    InvalidCredentials,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct User {
    username: String,
    privlege: Privilege,
    player: Player,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Privilege {
    Admin,
    User,
}

// ------------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Player {
    name: String,
}
