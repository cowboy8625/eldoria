#![allow(unused)]
use colored::Colorize;
use std::io::{Write, stdin};

use thiserror::Error;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct World {
    name: String,
    description: String,
    region: Vec<Region>,
}

#[derive(Debug, Deserialize)]
struct Region {
    description: String,
    rooms: Vec<Room>,
}

#[derive(Debug, Deserialize)]
struct Room {
    name: String,
    description: String,
    items: Vec<Item>,
    moves: Vec<Direction>,
}

#[derive(Debug, Deserialize)]
struct Item {
    name: String,
    description: String,
}

#[derive(Debug, Deserialize)]
enum Direction {
    North(String),
    South(String),
    East(String),
    West(String),
}

#[derive(Debug, Error)]
enum Error {
    #[error("unknown command")]
    UnknownCommand,
}

#[derive(Debug, Default)]
struct Player {
    name: String,
    location: Location,
}

impl Player {
    fn location(&self) -> String {
        let region = "region".green();
        let room = "room".green();
        format!("{region}: {}\n{room}: {}", self.location.region.yellow(), self.location.room.yellow())
    }
}

#[derive(Debug)]
struct Location {
    region: String,
    room: String,
}

impl Default for Location {
    fn default() -> Self {
        Self {
            region: String::from("The Verdant Glades"),
            room: String::from("Eldertree Grov"),
        }
    }
}

fn create_player() -> Player {
    let mut player = Player::default();
    while player.name.is_empty() {
        player.name = prompt("what is your name?: ".green());
    }
    player
}


enum Command {
    WhereAmI,
    WhoAmI,
    Reply(String),
    Exit,
}

impl TryFrom<&str> for Command {
    type Error = Error;
    fn try_from(s: &str) -> Result<Self, Self::Error> {
        match s {
            "exit" => Ok(Command::Exit),
            "lets go" => Ok(Command::Reply("where to?".to_string())),
            "who am i?" => Ok(Command::WhoAmI),
            "where am i?" => Ok(Command::WhereAmI),
            _ => Err(Error::UnknownCommand),
        }
    }
}

fn main() {

    let world_toml = std::fs::read_to_string("world.toml").expect("failed to read world.toml");
    let world: World = toml::from_str(&world_toml).expect("failed to parse world.toml");
    let player = create_player();

    loop {
        let line = prompt("> ".green());
        match Command::try_from(line.to_lowercase().trim()) {
            Ok(Command::WhereAmI) => {
                let location = player.location();
                println!("{location}");
            }
            Ok(Command::WhoAmI) => {
                println!("{}", player.name.yellow());
            }
            Ok(Command::Reply(reply)) => {
                println!("{}", reply.yellow());
            }
            Ok(Command::Exit) => match prompt("are you sure you want to exit the game? [y/n]: ".red()).trim() {
                "y" | "yes" => break,
                _ => continue,
            }
            Err(err) => {
                println!("{} {}", err.to_string().yellow(), line.trim().red());
            }
        }
    }

}

fn prompt(p: impl std::fmt::Display) -> String {
    let mut line = String::new();
    print!("{}", p);
    std::io::stdout().flush().expect("failed to flush stdout");
    stdin().read_line(&mut line).unwrap();
    line
}
