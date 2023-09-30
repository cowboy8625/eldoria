use iced::executor;
use iced::widget::{column, text, text_input, Column};

use iced::{Theme, Alignment, Element, Application, Settings, Subscription, Command};
use thiserror::Error;

#[derive(Debug, Clone, Error)]
pub enum Error {
    #[error("Something went wrong")]
    SomethingWentWrong,
}

pub fn main() -> iced::Result {
    MudClient::run(Settings::default())
}

struct MudClient {
    message: String,
    inbox: Vec<String>,
}

#[derive(Debug, Clone)]
enum Message {
    SendMessage,
    UpdateMessage(String),
    IncommingMessage(String),
}


impl Application for MudClient {
    type Message = Message;
    type Theme = Theme;
    type Flags = ();
    type Executor = executor::Default;

    fn new(_flags: Self::Flags) -> (Self, Command<Message>) {
        (
            Self {
                message: String::new(),
                inbox: vec![],
            },

            Command::none()
        )
    }

    fn title(&self) -> String {
        String::from("Counter - Iced")
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::UpdateMessage(ref message) => {
                self.message = message.to_string();
                Command::none()
            }
            Message::SendMessage => {
                eprintln!("Message: {}", self.message);
                self.message.clear();
                Command::none()
            }
            Message::IncommingMessage(message) => {
                self.inbox.push(message);
                Command::none()
            },
        }
    }

    fn view(&self) -> Element<Message> {
        column![
            Column::with_children(
                self.inbox.iter().map(|msg| text(msg).size(50).into()).collect::<Vec<_>>()
            ),
            text_input("....message", &self.message).on_input(Message::UpdateMessage).on_submit(Message::SendMessage),
        ]
        .padding(20)
        .align_items(Alignment::Center)
        .into()
    }

    fn subscription(&self) -> Subscription<Message> {
        sub::connect().map(Message::IncommingMessage)
    }
}

mod sub {
    use tokio::{
        io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
        net::TcpListener, sync::broadcast,
    };
    use iced::{Subscription, subscription};

    const ADDER: &str = "localhost:8080";

    enum State {
        Disconnected,
        Connected(TcpListener, broadcast::Sender<String>),
    }

    pub fn connect() -> Subscription<Event> {
        struct Connect;
        subscription::channel(
            std::any::TypeId::of::<Connect>(),
            100,
            |mut output| async move {
                let mut state = State::Disconnected;
                loop {
                    match &mut state {
                        State::Disconnected => {
                            let lisener = TcpListener::bind(ADDER).await.unwrap();
                            let (tx, _rx) = broadcast::channel(10);
                            let _ = output
                                    .send(Event::Connected(Connection(sender)))
                                    .await;

                            state = State::Connected(lisener, tx);
                        },
                        State::Connected(lisener, tx) => {
                            let Ok((mut socket, addr)) = lisener.accept().await else {
                                continue;
                            };
                tokio::select! {
                    result = reader.read_line(&mut line) => {
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
                    }
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
                            _ => {},
                        }
                    }
                }
                        }
                    }
                }
            },
        )
    }
}
