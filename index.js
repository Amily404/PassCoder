#!/usr/bin/env node

import path from 'path';
import chalk from "chalk";
import inquirer from "inquirer";
import clipboard from 'clipboardy';

import fs from 'fs';

import readline from 'readline';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

process.stdin.on('keypress', function (ch, key) {
    if (key && key.name === 'escape') {
        process.exit();
    }
});

let input = "";
let rules = [];

async function askPassword() {
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
    rules.forEach(rule => {
        input = input.replace(rule[0], rule[1]);
    });
}

async function menu() {
    const answers = await inquirer.prompt([
        {
            name: 'menu',
            type: 'list',
            message: 'What do you want to do?',
            choices: [
                "Create a password",
                "Edit password rules"
            ]
        }
    ]);

    if (answers.menu === "Create a password") {
        await askPassword();
        await encodePassword();
        console.log(chalk.green(input));
        console.log(chalk.gray("Password copied to clipboard!"));
        clipboard.write(input);
        return menu();
    }
    else if (answers.menu === "Edit password rules") {
        await editRules();
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
            message: 'What do you want to do?',
            choices: choices
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
                "Delete"
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
    }

}

async function addRule() {
    const answers = await inquirer.prompt([
        {
            name: 'rule',
            type: 'input',
            message: 'Enter the rule:'
        },
        {
            name: 'replace',
            type: 'input',
            message: 'Enter the replacement:'
        }
    ]);

    if (exists(answers.rule) === true) {
        console.log(chalk.red("Rule already existing!"));
        return editRules();
    }

    rules.push([answers.rule, answers.replace]);
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

main();