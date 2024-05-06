use serde::{Deserialize, Serialize};
use tokio::{net::TcpStream, sync::broadcast};

use anyhow::Result;
use server::CommandType;

pub async fn run(host: &str, port: &str) -> Result<()> {
    let Ok(adder) = format!("{host}:{port}").parse::<std::net::SocketAddr>() else {
        eprintln!("Failed to parse address: {host}:{port}");
        return Ok(());
    };
    eprintln!("aquire adder");
    match TcpStream::connect(adder).await {
        Ok(_) => {
            eprintln!("connected");
        }
        Err(error) => {
            eprintln!("Failed to connect {:?}", error);
        }
    }
    let Ok(stream) = TcpStream::connect(adder).await else {
        eprintln!("Failed to connect");
        return Ok(());
    };

    let (tx, rx) = broadcast::channel(10);

    tokio::spawn(async move {
        let tx = tx.clone();
        loop {
            let mut buf = Vec::new();
            let Ok(_) = stream.readable().await else {
                continue;
            };

            let Ok(_) = stream.try_read_buf(&mut buf) else {
                continue;
            };

            if buf.is_empty() {
                continue;
            }

            let Ok(event) = bincode::deserialize::<CommandType>(&buf) else {
                eprintln!("Failed to deserialize event");
                continue;
            };

            let Ok(_) = tx.send(event) else {
                eprintln!("Failed to send event");
                continue;
            };
        }
    });

    match app::App::new(rx) {
        Ok(mut a) => match a.run().await {
            Ok(_) => {}
            Err(error) => {
                eprintln!("Failed to run app {:?}", error);
            }
        },
        Err(error) => {
            eprintln!("Failed to create app {:?}", error);
        }
    }
    Ok(())
}

mod app {
    use super::CommandType;
    use anyhow::Result;
    use crossterm::{
        event::{self, Event},
        terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
        ExecutableCommand,
    };
    use ratatui::{prelude::*, widgets::Paragraph};
    use std::io::{stdout, Stdout};
    use tokio::sync::broadcast;
    type Tui = Terminal<CrosstermBackend<Stdout>>;

    pub struct App {
        rx: broadcast::Receiver<CommandType>,
        is_running: bool,
        text: String,
    }

    impl App {
        pub fn new(rx: broadcast::Receiver<CommandType>) -> Result<Self> {
            enable_raw_mode()?;
            stdout().execute(EnterAlternateScreen)?;
            Ok(Self {
                rx,
                is_running: true,
                text: String::new(),
            })
        }

        pub async fn run(&mut self) -> Result<()> {
            let mut terminal: Tui = Terminal::new(CrosstermBackend::new(stdout()))?;
            while self.is_running {
                if let Ok(data) = self.rx.try_recv() {
                    self.text = format!("{data:?}");
                }
                terminal.draw(|f| self.handle_render(f))?;
                if event::poll(std::time::Duration::from_millis(50))? {
                    self.handle_event(event::read()?)?;
                }
            }
            Ok(())
        }

        fn handle_render(&self, f: &mut Frame) {
            f.render_widget(Paragraph::new(format!("text: {:?}", self.text)), f.size());
        }

        fn handle_event(&mut self, event: Event) -> Result<()> {
            match event {
                Event::Key(key) => match key.code {
                    event::KeyCode::Char('q') => {
                        self.is_running = false;
                    }
                    _ => {}
                },
                _ => {}
            }
            Ok(())
        }
    }

    impl Drop for App {
        fn drop(&mut self) {
            disable_raw_mode().expect("Could not disable raw mode");
            stdout()
                .execute(LeaveAlternateScreen)
                .expect("Could not leave alternate screen");
        }
    }
}
