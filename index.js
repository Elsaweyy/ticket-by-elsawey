require('dotenv')
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, SelectMenuBuilder } = require('@discordjs/builders')

const { channel } = require('diagnostics_channel')


const { Client,
IntentsBitField,
TextInputBuilder,
ButtonStyle,
TextInputStyle,
ChannelType,
PermissionsBitField,
Embed,
ModalBuilder
 } = require('discord.js')


// client لا تلعب فيها 
const client = new Client({
    intents: [IntentsBitField.Flags.Guilds,
         IntentsBitField.Flags.GuildMessages, 
         IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildPresences]
})

const { Database } = require('st.db')
const db = new Database('Data/Ticket.json')

client.on('ready', () => {
    client.user.setActivity('Discord Ticket Bot')
    client.user.setStatus('dnd')
    console.log(`${client.user.tag}s Ready !`)
})

const prefix = '+' // البرفكس حقك
const Owners = ["858778134036217886", "",""] // ايديهات المتحكمين بالبوت
const Support = '1071915833498009690'// ايدي رتبه تقدر تشوف التيكت وتتحكم فيه
const icon = 'https://media.discordapp.net/attachments/1064360157733199982/1075847677893423174/profile.png?width=320&height=320' // رابط صوره السيرفر
const log = '1071927650135855144' // ايدي روم اللوق هنا

// امر setup 
client.on('messageCreate', Message => {
    if (Message.content.startsWith(prefix + 'setup')) {
        if (!Owners.includes(Message.author.id)) return;
        const cat = Message.content.split(" ").slice(1).join(" ")
        console.log(cat)
        if (!cat) return Message.reply({content: `😕 Pleas Add Category ID`})
        db.set(`Cat_${Message.guild.id}`, cat)
        // الامبد 
        let embed = new EmbedBuilder()
        .setAuthor({name: Message.guild.name, iconURL: Message.guild.iconURL()})
        .setColor(0xff00)
        .setDescription('**مرحبا بك في منطقه التيكت لفتح تيكت اضغط علي الزر ادناه**')
        .setThumbnail()
        .setFooter({text: Message.guild.name, iconURL: Message.guild.iconURL()})
        // بوتن
        let Button = new ButtonBuilder()
        .setCustomId('Ticket')
        .setLabel('Open Ticket')
        .setStyle(ButtonStyle.Success)
        const row = new ActionRowBuilder()
        .addComponents(Button)
        Message.delete()
        Message.channel.send({embeds: [embed], components: [row]})
    }
})

// interaction التيكت
client.on('interactionCreate', async Interaction => {
    if (!Interaction.isButton()) return;
    if (Interaction.customId === 'Ticket') {
        if(db.get(`users${Interaction.user.id}`) == true) {
            return Interaction.reply({content: `Your Have Ticket`, ephemeral: true})
        } else {
        const modal = new ModalBuilder().setCustomId('modal').setTitle('Reason ?')
        const Token = new TextInputBuilder().setRequired(true).setPlaceholder('اكتب ما هو السبب لفتح التيكت هنا ! ..').setCustomId('Token').setLabel('سبب فتح التيكت').setStyle(TextInputStyle.Paragraph).setMinLength(5)
        const black = new ActionRowBuilder().addComponents(Token)
        modal.addComponents(black)
            await Interaction.showModal(modal);
    }}
})

// هنابيصنع التيكت

client.on('interactionCreate', async Interaction => {
    if (!Interaction.isModalSubmit()) return;
    const reason = Interaction.fields.getTextInputValue('Token')
    if (Interaction.customId === 'modal') {
        const cat = db.get(`Cat_${Interaction.guild.id}`)
        Interaction.guild.channels.create({
            name: `Ticket ${Interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites:[
                {
                    id: Interaction.guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: Interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages']
                },
                {
                    id:`${Support}`,
                    allow: ['ViewChannel', 'SendMessages']
                }
            ], parent: `${cat}`
        }).then(async ch => {
            Interaction.reply({content: `**Done Create Your Ticket : ${ch}**`, ephemeral: true})
           const Chaneel = Interaction.guild.channels.cache.get(log)
           Chaneel.send({embeds: [new EmbedBuilder() .setTitle('Done Create Ticket').setDescription(`New Ticket : ${ch}`).setAuthor({name: Interaction.user.tag, iconURL: Interaction.user.displayAvatarURL()})]})
            const role = Interaction.guild.roles.cache.find(role => role.id === Support);
            if (role) { // التحقق من وجود الرتبة
                const onlineMembers = role.members.filter(member => member.presence?.status !== 'offline');
                console.log(`عدد الأعضاء المتصلين في الرتبة: ${onlineMembers.size}`);
              
            let embeds = new EmbedBuilder()
            .setAuthor({name: Interaction.user.tag, iconURL: Interaction.user.displayAvatarURL()})
            .setTitle('Ticket')
            .setFields(
                {name: `Member`, value: `${Interaction.user}`, inline: true},
                {name: `Support Ticket`, value: `<@&${Support}>`, inline: true},
                {name: `Reason`, value: `${reason}`, inline: true},
                {name: `Online Support`, value: `${onlineMembers.size}`, inline: true}
            )
            .setFooter({text: Interaction.user.tag, iconURL: Interaction.user.displayAvatarURL()})
            .setImage(`${icon}`)
            let Close = new ButtonBuilder().setCustomId('close').setLabel('Close').setStyle(ButtonStyle.Danger)
            let Claim = new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Success)
            let Call = new ButtonBuilder().setCustomId('call').setLabel('Call Support').setStyle(ButtonStyle.Primary)
            let row = new ActionRowBuilder().addComponents(Close,Claim,Call)
            ch.send({content: `Hello Member : ${Interaction.user} \n Support Role : <@&${Support}>`, embeds: [embeds], components: [row]}).then(() => {
                db.set(`users${Interaction.user.id}`, true)
                setTimeout(() => {
                    db.delete(`users${Interaction.user.id}`)
                }, 5000)
            })
        } else {
            console.log('الرتبة غير موجودة!');
          }})
    }
})

client.on('interactionCreate', async Interaction => {
    if (!Interaction.isButton()) return;
    const wait = require('node:timers/promises').setTimeout;
    if (Interaction.customId == 'close') {
        let embed = new EmbedBuilder()
        .setDescription(`**هل انت متاكد من اغلاق التيكت ؟**`)
        let Yes = new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Danger)
        let No = new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Primary)
    let roww = new ActionRowBuilder().addComponents(Yes,No)
Interaction.reply({content: `${Interaction.user}`, embeds: [embed], components: [roww]})    
}
if (Interaction.customId == 'yes') {
    db.delete(`Channel_${Interaction.channel.id}`)
    db.delete(`users${Interaction.user.id}`)
Interaction.reply({embeds: [new EmbedBuilder() .setDescription(`**سيتم حذف التذكره خلال 5 ثواني**`)]})
const Chaneel = Interaction.guild.channels.cache.get(log)
Chaneel.send({embeds: [new EmbedBuilder() .setTitle('Done Delete Ticket').setDescription(`Delete Ticket : ${Interaction.channel}`).setAuthor({name: Interaction.user.tag, iconURL: Interaction.user.displayAvatarURL()})]})
setTimeout(() => {
Interaction.channel.delete()
}, 5000)
}
if (Interaction.customId == 'no') {
    await Interaction.deferUpdate();
    await wait(5);
    Interaction.deleteReply()
    }
    if (Interaction.customId == 'call') {
        if (db.get(`Call_${Interaction.user.id}`) == true ) {
            return Interaction.channel.send({content: `**برجاء عدم ازعاج الاداره سيتم الرد عليك في اقرب وقت **`})
        } else {
     Interaction.reply({content: `**Pleas Come In Ticket <@&${Support}>**`, allowedMentions: { roles: [Support]}})
     db.set(`Call_${Interaction.user.id}`, true)
     setTimeout(() => {
     db.set(`Call_${Interaction.user.id}`, false)
     }, 500000)
        }}
        if (Interaction.customId == 'claim') {
            if (!Interaction.member.roles.cache.has(Support)) return Interaction.reply({content: `Only Support`, ephemeral: true})
            if (db.get(`Channel_${Interaction.channel.id}`) == true ) {
                return;
            } else {
                const Chaneel = Interaction.guild.channels.cache.get(log)
                Chaneel.send({embeds: [new EmbedBuilder() .setTitle('Done Claim Ticket').setDescription(`Claim Ticket : ${Interaction.user}`).setAuthor({name: Interaction.user.tag, iconURL: Interaction.user.displayAvatarURL()})]})
         Interaction.reply({content: `**Done Claim Ticket BY : ${Interaction.user}**`})
            db.set(`Channel_${Interaction.channel.id}`, true)
            }}
})


client.login('MTA3NDMwMzIzODM2MDI4OTMzMg.Gk1oY9.IqqdKDA4yX_Jqe2no6VzptRFXnC7hy14Qdb_bs')