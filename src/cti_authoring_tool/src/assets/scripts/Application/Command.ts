import { AppCommand } from "./Commands/AppCommand";
import { PageCommand } from "../PageEditor/Commands";

export type Command
    = AppCommand | PageCommand;

export type CommandEmitter 
    = () => Promise<Command> | Command;
