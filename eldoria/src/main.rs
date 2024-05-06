use clap::{crate_name, crate_version, Parser, Subcommand};
use anyhow::Result;

const AUTHOR: &str = "cowboy8625";

#[derive(Debug, Parser)]
#[command(
    name = crate_name!(),
    version = crate_version!(),
    author = AUTHOR,
    about = "Eldoria terminal client and server game",
    long_about = None
    )]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Server {
        #[arg(
            long,
            short = 'H',
            value_name = "HOST",
            default_value_t = String::from("127.0.0.1"),
        )]
        host: String,
        #[arg(
            long,
            short,
            value_name = "PORT",
            default_value_t = String::from("9009"),
        )]
        port: String,
    },
    Client {
        #[arg(
            long,
            short = 'H',
            value_name = "HOST",
            default_value_t = String::from("127.0.0.1"),
        )]
        host: String,
        #[arg(
            long,
            short,
            value_name = "PORT",
            default_value_t = String::from("9009"),
        )]
        port: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Server { host, port } => {
            server::run(&host, &port).await?;
        }
        Commands::Client { host, port } => {
            terminal_client::run(&host, &port).await?;
        }
    }
    Ok(())
}
