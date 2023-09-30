use std::net::SocketAddr;
use std::collections::HashMap;
use std::sync::Arc;

use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    net::TcpListener, sync::broadcast,
    sync::Mutex,
};

type PlayerList = Arc<Mutex<HashMap<SocketAddr, String>>>;

enum State {
    Create,
    Connected
}

const ADDER: &str = "localhost:8080";
#[tokio::main]
async fn main() {
    let listener = TcpListener::bind(ADDER).await.unwrap();
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
            let mut reader = BufReader::new(reader);

            let mut line = String::new();
            let mut state = {
                let data = players_list.lock().await;
                if data.contains_key(&addr) {
                    tx.send(Command::Echo("username:\r\n".into(), addr)).unwrap();
                    println!("returning player");
                    State::Connected
                } else {
                    println!("new player");
                    State::Create
                }
            };

            loop {
                tokio::select! {
                    result = rx.recv() => {
                        let Ok(cmd) = result else {
                            return;
                        };
                        match cmd {
                            Command::Online(other_addr) if other_addr == addr => {
                                let data = players_list.lock().await;
                                let pl = data
                                    .iter()
                                    .filter(|(o,_)| o.to_string() != addr.to_string())
                                    .map(|(_, name)| name.clone())
                                    .collect::<Vec<_>>()
                                    .join(",\r\n") + "\r\n";
                                writer.write_all(&pl.as_bytes()).await.unwrap();
                            },
                            Command::Message(msg, other_addr) => {
                                if other_addr != addr {
                                    writer.write_all(&msg.as_bytes()).await.unwrap();
                                }
                            }

                            Command::Echo(msg, other_addr) => {
                                if other_addr == addr {
                                    writer.write_all(msg.as_bytes()).await.unwrap();
                                }
                            }
                            _ => {},
                        }
                    }
                    result = reader.read_line(&mut line) => {
                        match &mut state {
                            State::Create => {
                                if result.unwrap_or_default() == 0 {
                                    continue;
                                }
                                let name = line.trim().to_string();
                                eprintln!("{} -> {}", addr, name);
                                players_list.lock().await.insert(addr, name);
                                line.clear();
                                state = State::Connected;
                            },
                            State::Connected => {
                                if result.unwrap_or_default() == 0 {
                                    break;
                                }
                                match line.trim() {
                                    "online" => {
                                        println!("online command");
                                        tx.send(Command::Online(addr)).unwrap();
                                    }
                                    msg => {
                                        println!("just a message command");
                                        tx.send(Command::Message(format!("{msg}\r\n"), addr)).unwrap();
                                    }
                                }
                                line.clear();
                            },
                        }
                    }
                }
            }
        });
    }
}

#[derive(Debug, Clone)]
enum Command {
    Online(SocketAddr),
    Message(String, SocketAddr),
    Echo(String, SocketAddr),
}

