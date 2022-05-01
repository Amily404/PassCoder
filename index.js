#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import clipboard from 'clipboardy';

import fs from 'fs';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let input = "";
let rules = [];
let pack = JSON.parse(fs.readFileSync(__dirname + '/package.json'));

import yargs from "yargs";
import { hideBin } from 'yargs/helpers';
yargs(hideBin(process.argv))
    .version(`v${pack.version}`).argv;


async function askPassword() {
    if (rules.length === 0) {
        console.log(chalk.red("No rules found: please add some!"));
        return menu();
    }

    const answers = await inquirer.prompt([
        {
            name: "password",
            type: "input",
            message: "Enter your password:",
        }
    ]);

    input = answers.password;
}

async function encodePassword() {
    //create regex from rules
    let regex = "";
    rules.forEach((a) => {
        regex += a[0] + "|";
    });
    regex = regex.substring(0, regex.length - 1);
    regex = new RegExp(regex, "g");

    //encode password
    input = input.replace(regex, (a) => {
        for (let i = 0; i < rules.length; i++) {
            if (rules[i][0] === a) {
                return rules[i][1];
            }
        }
    });
}

async function menu() {
    const answers = await inquirer.prompt([
        {
            name: 'menu',
            type: 'list',
            message: 'PassCoder:',
            choices: [
                "Create a password",
                "Edit password rules",
                "Exit"
            ]
        }
    ]);

    if (answers.menu === "Create a password") {
        await askPassword();
        await encodePassword();
        console.log(chalk.green(input));
        console.log(chalk.gray("Password copied to clipboard!" + '\n'));
        clipboard.write(input);
        return menu();
    }
    else if (answers.menu === "Edit password rules") {
        await editRules();
    } else if (answers.menu === "Exit") {
        return;
    }

}

async function editRules() {
    let choices = rules.map((a) => {
        return `${a[0]} - ${a[1]}`;
    })

    choices.push("Add a new rule");
    choices.push("Cancel");

    const answers = await inquirer.prompt([
        {
            name: 'rules',
            type: 'list',
            message: 'Select a rule to modify or create a new one.',
            choices: choices,
            pageSize: 15
        }
    ]);

    if (answers.rules === "Add a new rule") {
        await addRule();
    }
    else if (answers.rules === "Cancel") {
        return menu();
    }
    else {
        await editRule(answers.rules);
    }
}

async function editRule(rule) {
    rule.split(" - ");

    const answers = await inquirer.prompt([
        {
            name: 'rule',
            type: 'list',
            message: 'Edit or delete?',
            choices: [
                "Edit",
                "Delete",
                "Cancel"
            ]
        }
    ]);

    if (answers.rule === "Edit") {
        const ans = await inquirer.prompt([
            {
                name: 'edit',
                type: 'input',
                message: `Enter the new value for "${rule[0]}": `
            }
        ]);

        rules.forEach((a, i) => {
            if (a[0] === rule[0]) {
                rules[i][1] = ans.edit;
            }
        });

        await saveRules();
        console.log(chalk.green('Rule edited!'));
        return editRules();
    } else if (answers.rule === "Delete") {
        rules.forEach((a, i) => {
            if (a[0] === rule[0]) {
                rules.splice(i, 1);
            }
        });
        await saveRules();
        return editRules();
    } else if (answers.rule === "Cancel") {
        return editRules();
    }

}

async function addRule() {
    const answers = await inquirer.prompt([
        {
            name: 'addRule',
            type: 'input',
            message: 'Enter the original value:'
        },
        {
            name: 'replace',
            type: 'input',
            message: 'Enter the replacement:'
        }
    ]);

    if (exists(answers.addRule) === true) {
        console.log(chalk.red("Rule already existing!"));
        return editRules();
    }

    rules.push([answers.addRule, answers.replace]);
    await saveRules();
    console.log(chalk.green('Rule added!'));
    return editRules();

}

async function exists(rule) {
    rule.split(" - ")[0];

    let Rules = rules.map((a) => {
        return a[0];
    })

    return Rules.includes(rule);
}

async function loadFile() {
    if (fs.existsSync(process.env.APPDATA + '/passcoder/table.json', { encoding: 'utf8' })) {
        rules = JSON.parse(fs.readFileSync(process.env.APPDATA + '/passcoder/table.json', { encoding: 'utf8' }));
    } else {
        if (!fs.existsSync(process.env.APPDATA + '/passcoder')) {
            fs.mkdirSync(process.env.APPDATA + '/passcoder');
        }
        fs.writeFileSync(process.env.APPDATA + '/passcoder/table.json', JSON.stringify(rules));
    }
}

async function saveRules() {
    fs.writeFileSync(process.env.APPDATA + '/passcoder/table.json', JSON.stringify(rules), { encoding: 'utf8' });
    //console.log(chalk.green('Rules saved!'));
}
 
async function main() {
    await loadFile();
    await menu();
}

await main();