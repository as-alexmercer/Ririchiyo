const BaseCommand = require('../../utils/structures/BaseCommand');
const { parser: parse } = require('discord-markdown');
const { inspect } = require('util');
const { VultrexHaste } = require('vultrex.haste');
const hasteBin = new VultrexHaste({ url: "https://hasteb.in" });

module.exports = class EvalCommand extends BaseCommand {
    constructor() {
        super({
            name: "eval",
            aliases: "e",
            category: "developer",
            description: "Evaluate a code snippet",
            editedEvent: true,
            requiredPermissionsToView: { internal: ["BOT_OWNER"] }
        })
    }
    async run({ message, arg, editedEvent, guildData }) {
        if (!message.channel.clientPermissions.has("EMBED_LINKS")) return message.channel.send("I don't have permissions to send message embeds in this channel");
        if (!message.author.permissions.internal.final.has("BOT_OWNER")) return message.channel.send(this.embedify(message.guild, "You don't have permission to use that command!", true));

        if (!arg) return message.channel.send(this.embedify(message.guild, "Please provide code to evaluate in a js code block!", true));
        const parsedArray = parse(arg, { discordOnly: true });
        const codeBlock = parsedArray.filter(obj => obj.type === 'codeBlock')[0];
        if (!codeBlock) return message.channel.send(this.embedify(message.guild, "Please provide code to evaluate in a js code block!", true));
        if (codeBlock.lang != '' && codeBlock.lang != 'js') return message.channel.send(this.embedify(message.guild, "Only js eval is supported!", true));
        const code = codeBlock.content;
        const finalExecCode = await code.replace(/\\n/g, "\n").trim();
        if (!finalExecCode) return message.channel.send(this.embedify(message.guild, "Please provide code to evaluate in a js code block!", true));

        try {
            const start = process.hrtime();
            let result = await eval(finalExecCode);
            const execTime = process.hrtime(start);

            if (typeof result !== "string") result = inspect(result);

            if (message.oldEvalMessage && editedEvent) return await message.oldEvalMessage.edit(this.embedify(message.guild, await generateResult(finalExecCode, result, execTime)));
            else return message.oldEvalMessage = await message.channel.send(this.embedify(message.guild, await generateResult(finalExecCode, result, execTime)));
        }
        catch (err) {
            if (message.oldEvalMessage && editedEvent) return await message.oldEvalMessage.edit(this.embedify(message.guild, await generateResult(finalExecCode, err.message, null, true), true));
            else return message.oldEvalMessage = await message.channel.send(this.embedify(message.guild, await generateResult(finalExecCode, err.message, null, true), true));
        }
    }
}

async function generateResult(input, output, execTime, error) {
    const inputCodeBlock = `\`\`\`js\n${input.replace(/`/g, "'")}\n\`\`\``
    const formattedExecTime = !error ? `${execTime[0] > 0 ? `${execTime[0]}s ` : ""}${execTime[1] / 1e6}ms` : null;
    const outputCodeBlock = !error ? `\`\`\`js\n${output.replace(/`/g, "'")}\n\`\`\`` : `\`\`\`diff\n${output.replace(/`/g, "'")}\`\`\``.split("\n").join("\n- ");

    let resultString = `**Input**\n${inputCodeBlock}\n${!error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!error ? `**Result**` : `**Error**`}\n${outputCodeBlock}`;

    if (resultString.length > 2048) {
        hastebinString = `${await multiLineComment("Input")}${input}\n\n${!error ? `//Executed in ${formattedExecTime}\n\n` : ""}${await multiLineComment(!error ? "Result" : "Error")}${output}`
        const hastebinHyperlink = `**[Hastebin](${await hasteBin.post(hastebinString)})**`;
        resultString = `**Input**\n${inputCodeBlock}\n${!error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!error ? `**Result**` : `**Error**`}\n${hastebinHyperlink}`;
        if (resultString.length > 2048) {
            resultString = `**Input was too long to be displayed here so I have added it to hastebin!**\n${!error ? `**Executed in ${formattedExecTime}**\n\n` : ""}${!error ? `**Result**` : `**Error**`}\n${hastebinHyperlink}`;
        }
    }
    return resultString;
}

async function multiLineComment(comment) {
    return `/**\n * ${comment}\n */\n`;
}