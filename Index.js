const discord = require(`discord.js`);
const client = new discord.Client();
const BDD = require(`./BaseDeDonnée.json`);
const fs = require(`fs`);
const ytsr = require(`ytsr`);
const ytdl = require(`ytdl-core`);
const lyricsFinder = require(`lyrics-finder`);
const queue = new Map();
var prefix = `!`;

client.on(`ready`, () =>
{
    console.log(`Bot opérationnel !`);
    client.user.setActivity(`Mon prefix est: ${prefix}`, { type: `LISTENING` });
});

client.on(`guildMemberAdd`, (member) =>
{
    member.guild.systemChannel.send(`Bienvenue à toi ${member.user.username} !`);
});

client.on(`message`, async (message) => 
{
    if(message.author.bot)
    {
        return;
    }

    if(!BDD[message.guild.id])
    {
        BDD[message.guild.id] = {};
        saveBDD();
    }
    else if(!BDD[message.guild.id][`prefix`])
    {
        BDD[message.guild.id][`prefix`] = `!`;
        saveBDD();
    }
    else if(BDD[message.guild.id][`prefix`])
    {
        prefix = BDD[message.guild.id][`prefix`];
    }

    if(message.content.startsWith(`${prefix}config`))
    {
        if(!message.member.hasPermission(`MANAGE_GUILD`))
        {
            return message.channel.send(`Vous n'avez pas la permission de gérer le serveur !`);
        }

        let args = message.content.split(` `);
        if(!args[1])
        {
            return message.channel.send(`Veuillez indiquer ce que vous voulez configurer:\n${prefix}config prefix\n${prefix}config channelBienvenue`);
        }

        switch(args[1].toLowerCase())
        {
            case `prefix`:
                if(!args[2])
                {
                    return message.channel.send(`Veuillez indiquer le nouveau prefix à mettre !`);
                }

                BDD[message.guild.id][`prefix`] = args[2];
                saveBDD();
                prefix = BDD[message.guild.id][`prefix`];
                message.channel.send(`Le nouveau prefix est: ${prefix}`);
                break;
            
            case `channelBienvenue`:
                if(!args[2])
                {
                    return message.channel.send(`Veuillez indiquer un channel à mettre !`);
                }
                if(args[2] != message.mentions.channels)
                {
                    return message.channel.send(`Veuillez mentionner un channel !`);
                }
                BDD[message.guild.id][`channelBienvenue`] = message.mentions.channels;
                saveBDD();
                message.channel.send(`L'annonce des nouveaux membres se fera dans le channel: ${message.mentions.channels}`);
                break;
        }
    }

    if(message.content.startsWith(`${prefix}support`))
    {
        let args = message.content.split(` `);
        let description = args.splice(prefix.length).join(` `);

        if(!description)
        {
            return message.channel.send(`<@${message.author.id}> Veuillez rentrer une description précise afin que je puisse l'envoyer à <@${BDD[`idNiroshy`]}>`);
        }
        else
        {
            client.users.cache.get(BDD[`idNiroshy`]).send(`<@${message.author.id}> Besoin de support, plus de précision: ${description}`);
            message.channel.send(`Votre description à bien été envoyé à notre développeur (<@${BDD[`idNiroshy`]}>)`);
        }
    }

    if(message.content.startsWith(`${prefix}giveaway`))
    {
        let args = message.content.split(` `);
        let mentionChannel = message.mentions.channels.first();

        if(BDD[message.guild.id][`giveawayMessageID`] != null)
        {
            return message.channel.send(`Il y a actuellement un giveaway en cours !`);
        }
        if(!mentionChannel)
        {
            return message.channel.send(`Veuillez indiquer un channel pour l'annonce du giveaway !`);
        }
        if((!args[2]) || (isNaN(args[2])))
        {
            return message.channel.send(`Veuillez indiquer un temps à mettre !`);
        }
        let description = args.splice(3).join(` `);
        if(!description)
        {
            return message.channel.send(`Veuillez indiquer une description au giveaway !`);
        }
        if(!message.member.hasPermission(`MANAGE_MESSAGES`))
        {
            return message.channel.send(`Vous n'avez pas la permission de gérer les messages !`);
        }
        
        let embed = new discord.MessageEmbed()
        .setColor(`#FEF600`)
        .setTitle(`**GIVEAWAY**`)
        .setAuthor(message.author.username, message.author.displayAvatarURL({ format: `png`, dynamic: true }))
        .setThumbnail(message.guild.iconURL({ format: `png`, dynamic: true }))
        .setDescription(`${description}\nPour y participer veuillez cliquer sur l'émoji :gift:`)
        .setFooter(`H-Bots by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }))
        .setTimestamp();
        await message.channel.send(embed).then(message =>
        {
            message.react(`🎁`);
            BDD[message.guild.id][`giveawayMessageID`] = message.id;
            saveBDD();
        });
        message.channel.send(`Le giveaway vient de commencer !`);
        setTimeout(function()
        {
            let index = Math.floor(Math.random() * Math.floor(BDD[message.guild.id][`participantGiveaway`].length));
            let winner = client.users.cache.get(BDD[message.guild.id][`participantGiveaway`][index]);
            if(!winner)
            {
                return message.channel.send(`Pas de gagnant !`);
            }
            else
            {
                mentionChannel.send(`Et le gagnant est: ${winner} ! Bravo ! Son gain est: ${description}`);
                winner.send(`Bravo tu viens de gagner le giveaway ! Ton gain: ${description}`);
                BDD[message.guild.id][`giveawayMessageID`] = null;
                saveBDD();
                BDD[message.guild.id][`participantGiveaway`] = [];
                saveBDD();
            }
        }, args[2] * 1000);
    }

    if(message.content.startsWith(`${prefix}embed`))
    {
        let embedBeforeEdit = new discord.MessageEmbed()
        .setDescription(`** **`);

        const embed = new discord.MessageEmbed();
        embed.setDescription(`...`);
        let msgEmbedForEditing = await message.channel.send(embedBeforeEdit);
        const msgwait = await message.channel.send(embed);
        await Promise.all([`✏️`, `💬`, `🕵️`, `🕙`, `🖼️`, `🌐`, `🔵`, `↩️`, `✅`, `❌`, `📑`].map(r => msgwait.react(r)));
        embed.setColor(`#cf1717`);
        embed.setTitle(`Embed Builder`);
        embed.setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true, size: 512}));
        embed.setDescription(`Bienvenue sur le menu d'Embed Builder ! \n Cliquez sur les reactions pour pouvoir personnaliser votre Embed !`);
        embed.addField(`✏️`, `**__Permet de modifier le Titre__**`, true);
        embed.addField(`💬`, `**__Permet de modifier la Description__**`, true);
        embed.addField(`🕵️`, `**__Permet de modifier l'Auteur__**`, true);
        embed.addField(`🕙`, `**__Permet d'jouter un Timestamp__**`, true);
        embed.addField(`🖼️`, `**__Permet de modifier l'Image__**`, true);
        embed.addField(`🌐`, `**__Permet de modifier l'Url__**`, true);
        embed.addField(`🔵`, `**__Permet de modifier la Couleur__**`, true);
        embed.addField(`↩️`, `**__Permet d'ajouter un Field__**`, true);
        embed.addField(`✅`, `**__Permet d'envoyer l'Embed__**`, true);
        embed.addField(`❌`, `**__Permet d'annuler l'Embed__**`, true);
        embed.addField(`📑`, `**__Permet de copier un Embed__**`, true);
        embed.setFooter(`H-Bots by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }));
        embed.setTimestamp();

        await msgwait.edit(embed);

        const filterReaction = (reaction, user) => user.id == message.author.id && !user.bot;
        const filterMessage = (m) => m.author.id == message.author.id && !m.author.bot;
        const collectorReaction = await new discord.ReactionCollector(msgwait, filterReaction);
        collectorReaction.on('collect', async reaction =>
        {
            switch(reaction._emoji.name)
            {
                case `✏️`:
                const msgQuestionTitle = await message.channel.send(`Quel est votre titre ?`);
                const title = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionTitle.delete();
                embedBeforeEdit.setTitle(title);
                msgEmbedForEditing.edit(embedBeforeEdit); 
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `✏️`).remove();
                break; 

                case `💬`:
                const msgQuestionDescription = await message.channel.send(`Quelle est votre description ?`);
                const description = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionDescription.delete();
                embedBeforeEdit.setDescription(description);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `💬`).remove();
                break;

                case `🕵️`:
                const msgQuestionAuteur = await message.channel.send(`Quel est votre auteur ?`);
                const auteur = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionAuteur.delete();
                embedBeforeEdit.setAuthor(auteur);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `🕵️`).remove();
                break;    

                case `🕙`:
                embedBeforeEdit.setTimestamp();
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `🕙`).remove();
                break;

                case `🖼️`:
                const msgQuestionImage = await message.channel.send(`Quelle est votre image ?`);
                const image = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                if((!image.includes(`http`)) || (!image.includes(`https`)))
                {
                    return message.channel.send(`Image incorrect`);
                }
                message.delete();
                msgQuestionImage.delete();
                embedBeforeEdit.setImage(image);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `🖼️`).remove();
                break;   

                case `🌐`:
                const msgQuestionURL = await message.channel.send(`Quelle est votre URL ?`);
                const URL = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionURL.delete();
                embedBeforeEdit.setURL(URL);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `🌐`).remove();
                break;   

                case `🔵`:
                const msgQuestionColor = await message.channel.send(`Quelle est votre couleur ? En Hexadécimal`);
                const color = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionColor.delete();
                embedBeforeEdit.setColor(color);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `🔵`).remove();
                break;

                case `↩️`:
                const msgQuestionField = await message.channel.send(`Quel est votre titre du field ?`);
                const titrefield = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionField.delete();
                const msgQuestionDescField = await message.channel.send(`Quelle est votre description du Field ?`);
                const descfield = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionDescField.delete();
                embedBeforeEdit.addField(titrefield, descfield);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgwait.reactions.cache.find(reaction => reaction.emoji.name == `↩️`).remove();
                break;

                case `✅`:
                const msgQuestionChannelr = await message.channel.send(`Merci de mettre l'ID du salon ou il doit apparaître`);
                const channel = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first().content;
                message.delete();
                msgQuestionChannelr.delete();
                if(!message.guild.channels.cache.get(channel))
                {
                    return message.channel.send(`ID de salon invalide !`);
                }
                else
                {
                    message.guild.channels.cache.get(channel).send(embedBeforeEdit);
                    msgwait.reactions.cache.find(reaction => reaction.emoji.name == `✅`).remove();
                }
                break;

                case `❌`:
                msgEmbedForEditing.delete(embedBeforeEdit);
                msgwait.delete();
                message.delete();
                message.channel.send(`❌ L'embed a bien été annulé.`).then(msg => msg.delete({ timeout: 3000 }));
                break;

                case `📑`:
                const msgQuestionNameChannel = await message.channel.send(`Dans quel salon se trouve le message du bot que vous souhaitez modifier avec l'embed que vous venez de créer ?\nMentionner le salon voulu.\n__Exemple:__ #exemple`);
                const messagenamechannel = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first();
                msgQuestionNameChannel.delete();
                messagenamechannel.delete();
                if(!messagenamechannel.mentions.channels.first())
                {
                    return message.channel.send(`Veuillez **mentionner** le salon dans lequel se trouve le message du bot que vous souhaitez modifier avec l'embed que vous venez de créer.\n__Exemple:__ #exemple`).then((error) => error.delete({timeout: 5000}));
                } 
                const namechannel = messagenamechannel.mentions.channels.first();
                const msgQuestionIDMessage = await message.channel.send(`Merci de renseigner l'id du message du bot que vous souhaitez modifier.`);
                const idmessage = (await message.channel.awaitMessages(filterMessage, {max: 1, time: 60000})).first();
                msgQuestionIDMessage.delete();
                idmessage.delete();
                if((!Number(idmessage.content)) || (!message.guild.channels.cache.get(namechannel.id).messages.fetch(idmessage.content)))
                {
                    return message.channel.send(`Le message que vous souhaitez modifier n'as pas été trouvé, veuillez réessayer.`).then((error) => error.delete({timeout: 5000}));
                }
                const modifiedmessage = await message.guild.channels.cache.get(namechannel.id).messages.fetch(idmessage.content);
                const confirmmessage = await message.channel.send(`:warning: Vous êtes sur le point de modifier un message du bot !\n:one: Juste ajouter l'embed sous le message\n:two: Complètement supprimer le message actuel et le remplacer par l'embed.`);
                await Promise.all(['1️⃣','2️⃣'].map(r => confirmmessage.react(r)));
                const collectionReaction2 = await new Discord.ReactionCollector(confirmmessage, filterReaction);
                collectionReaction2.on('collect', async reaction2 =>
                {
                    reaction2.users.remove(message.author);
                    switch(reaction2._emoji.name)
                    {
                        case `1️⃣`:
                            modifiedmessage.edit(embedBeforeEdit);
                            confirmmessage.delete();
                            break;

                        case `2️⃣`:
                            modifiedmessage.edit(``,embedBeforeEdit);
                            confirmmessage.delete();
                            break;
                    }
                  });
                }
              });
            }

    if(message.content.startsWith(`${prefix}play`))
    {
        let args = message.content.split(` `);
        let serverQueue = queue.get(message.guild.id); 
        execute(message, serverQueue, args);
    }

    if(message.content.startsWith(`${prefix}search`))
    {
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas connecté dans un salon vocal !`);
        }

        message.member.voice.channel.join().then(async connection =>
        {
            let args = message.content.split(` `);
            let research = args.splice(prefix.length).join(` `);
            if(!research)
            {
                return message.channel.send(`Veuillez indiquer une recherche !`);
            }

            let music = await ytsr(research);
            let video = music.items.filter(res => res.type == `video`)[0];
            if(!video)
            {
                return message.channel.send(`Pas de vidéo trouvée !`);
            }

            let embed = new discord.MessageEmbed()
            .setColor(`#00FEFA`)
            .setTitle(`**SEARCH**`)
            .setAuthor(message.author.username, message.author.displayAvatarURL({ format: `png`, dynamic: true }))
            .setThumbnail(message.guild.iconURL({ format: `png`, dynamic: true }))
            .setImage(video.bestThumbnail.url)
            .addField(`Auteur`, video.author.name, true)
            .addField(`Vues`, video.views, true)
            .addField(`Durée`, video.duration, true)
            .addField(`Date de sortie`, video.uploadedAt, true)
            .setFooter(`H-Bots by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }))
            .setTimestamp();

            await message.channel.send(embed);

            let dispatcher = connection.play(ytdl(video.url, { quality: `highestaudio` }));

            dispatcher.on(`finish`, () =>
            {
                dispatcher.destroy();
                return message.channel.send(`Musique terminée !`);
            });

        }).catch(err =>
        {
            message.channel.send(`Une erreur est survenue, pour plus de détails: ${err}`);
        });
    }

    if(message.content.startsWith(`${prefix}stop`))
    {
        let serverQueue = queue.get(message.guild.id);
        stop(message, serverQueue);
    }

    if(message.content.startsWith(`${prefix}pause`))
    {
        let serverQueue = queue.get(message.guild.id);
        pause(serverQueue);
    }

    if(message.content.startsWith(`${prefix}resume`))
    {
        let serverQueue = queue.get(message.guild.id);
        resume(serverQueue);
    }

    if(message.content.startsWith(`${prefix}loop`))
    {
        let args = message.content.split(` `);
        let serverQueue = queue.get(message.guild.id);
        loop(args, serverQueue);
    }

    if(message.content.startsWith(`${prefix}queue`))
    {
        let serverQueue = queue.get(message.guild.id);
        queueMusic(serverQueue);
    }

    if(message.content.startsWith(`${prefix}lyrics`))
    {
        let args = message.content.split(` `);
        let serverQueue = queue.get(message.guild.id);

        if(args[1] == `musique`)
        {
            let artiste = ``;
            let songName = ``;
            let pages = [];
            let currentPage = 0;
            const messageFilter = m => m.author.id === message.author.id;
            const reactionFilter = (reaction, user) => [`⬅️`, `➡️`].includes(reaction.emoji.name) && (message.author.id === user.id);

            if(args.length = 2)
            {
                message.channel.send(`Veuillez entrer le chanteur de la musique maintenant !`);

                await message.channel.awaitMessages(MessageFilter, { max: 1, time: 15000 }).then(collected =>
                    {
                        artiste = collected.first().content;

                    }).catch(() =>
                    {
                        artiste = ``;

                        return message.channel.send(`Le temps est écoulé !`);
                    });

                    message.channel.send(`Veuillez rentrer le titre de la musique maintenant !`);

                    await message.channel.awaitMessages(messageFilter, { max: 1, time: 15000 }).then(async collected =>
                        {
                            songName = collected.first().content;
        
                            await finder(artiste, songName, message, pages);
                        }).catch(() =>
                        {
                            artiste = ``;
                            songName = ``;
                            return message.channel.send(`Le temps est écoulé !`);
                        });
        
                    const lyricEmbed = await message.channel.send(`Lyric page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
                    await lyricEmbed.react(`⬅️`);
                    await lyricEmbed.react(`➡️`);
        
                    const Collector = lyricEmbed.createReactionCollector(reactionFilter);
        
                    Collector.on(`collect`, (reaction, user) =>
                    {
                        if(reaction.emoji.name === `➡️`)
                        {
                            if(currentPage < pages.length - 1)
                            {
                                currentPage += 1;
                                lyricEmbed.edit(`Lyrics page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
                                message.reactions.resolve(reaction).users.remove(user);
                            }
                        }
                        else if(reaction.emoji.name === `⬅️`)
                        {
                            if(currentPage !== 0)
                            {
                                currentPage -= 1;
                                lyricEmbed.edit(`Lyrics page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
                                message.reactions.resolve(reaction).users.remove(user);
                            }
                        }
                    });
            }
        }

           if(serverQueue && args.length == 1)
           {
            let artiste = serverQueue.songs[0].author;
            let songName = serverQueue.songs[0].title;
            let pages = [];
            let currentPage = 0;
            const reactionFilter = (reaction, user) => [`⬅️`, `➡️`].includes(reaction.emoji.name) && (message.author.id === user.id);
 
            await finder(artiste, songName, message, pages);
 
            const lyricEmbed = await message.channel.send(`Lyric page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
            await lyricEmbed.react(`⬅️`);
            await lyricEmbed.react(`➡️`);
 
            const Collector = lyricEmbed.createReactionCollector(reactionFilter);
 
            Collector.on(`collect`, (reaction, user) =>
            {
                if(reaction.emoji.name === `➡️`)
                {
                    if(currentPage < pages.length - 1)
                    {
                        currentPage += 1;
                        lyricEmbed.edit(`Lyrics page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
                        message.reactions.resolve(reaction).users.remove(user);
                    }
                }
                else if(reaction.emoji.name === `⬅️`)
                {
                    if(currentPage !== 0)
                    {
                        currentPage -= 1;
                        lyricEmbed.edit(`Lyrics page: ${currentPage + 1} / ${pages.length}`, pages[currentPage]);
                        message.reactions.resolve(reaction).users.remove(user);
                    }
                }
            });
           }
           else
           {
               return message.channel.send(`Veuillez mettre uniquement -lyrics`);
           }
        }


    async function execute(message, serverQueue, args)
    {
        let vc = message.member.voice.channel;
        let Query = args.splice(1).join(` `);
    
        if(!vc)
        {
            return message.channel.send(`Vous n'êtes pas connecté dans un salon vocal !`);
        }
        else if(!Query)
        {
            return message.channel.send(`Veuillez mettre le titre de la musique !`);
        }
        else
        {
            let res = await ytsr(Query);
            let video = res.items.filter(i => i.type == `video`)[0];
    
            if(!video)
            {
                return message.channel.send(`Pas de résultat !`);
            }
    
            const songInfo = await ytdl.getInfo(video.url);
    
            let song = 
            {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                author: video.author.name,
            }
    
            if(!serverQueue)
            {
                const queueConstructor =
                {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true,
                }
    
                queue.set(message.guild.id, queueConstructor);
    
                queueConstructor.songs.push(song);
    
                try
                {
                    let connection = await vc.join();
    
                    queueConstructor.connection = connection;
    
                    play(message.guild, queueConstructor.songs[0]);
  
                    var embed = new discord.MessageEmbed()
                    .setColor(`#00F6FE`)
                    .setTitle(`**SEARCH**`)
                    .setAuthor(message.member.displayName, message.author.displayAvatarURL({ format: `png`, dynamic: true }))
                    .setImage(`${video.bestThumbnail.url}`)
                    .setThumbnail(`${message.guild.iconURL({ format: `png`, dynamic: true })}`)
                    .setDescription(`${video.title}`)
                    .addField(`Auteur`, video.author.name, true)
                    .addField(`Vues`, video.views, true)
                    .addField(`Durée`, video.duration, true)
                    .setFooter(`H-Bot by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }))
                    .setTimestamp();

                    message.channel.send(embed);
                }
                catch(err)
                {
                    console.log(err);
    
                    queue.delete(message.guild.id);
                    return message.channel.send(`Impossible de rejoindre la vocal ! ${err}`);
                }
            }
            else
            {
                serverQueue.songs.push(song);
                return message.channel.send(`La musique a bien été ajoutée ! ${song.url}`);
            }
        }
    }
    
    function play(guild, song)
    {
        const serverQueue = queue.get(guild.id);
    
        if(!song)
        {
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
    
        const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on(`finish`, () =>
        {
            if(serverQueue.loopmusique)
            {
                play(guild, serverQueue.songs[0]);
            }
            else if(serverQueue.loopqueue)
            {
                serverQueue.songs.push(serverQueue.songs[0]);
                serverQueue.songs.shift();
            }
            else
            {
                serverQueue.songs.shift();
            }
            
            play(guild, serverQueue.songs[0]);
        });
    }
    
    function stop(message, serverQueue)
    {
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas dans un salon vocal !`);
        }
    
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    
    function skip(message, serverQueue)
    {
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas dans un salon vocal !`);
        }
    
        if(!serverQueue)
        {
            return message.channel.send(`Il n'y a pas de musique !`);
        }
    
        serverQueue.connection.dispatcher.end();
    }
    
    function pause(serverQueue)
    {
        if(!serverQueue)
        {
            return message.channel.send(`Il y a aucune musique en cours !`);
        }
    
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas connecté dans un salon vocal !`);
        }
    
        if(serverQueue.connection.dispatcher.paused)
        {
            return message.channel.send(`La musique est déjà en pause !`);
        }
    
        serverQueue.connection.dispatcher.pause();
    
        message.channel.send(`La musique a bien été mis en pause !`);
    }
    
    function resume(serverQueue)
    {
        if(!serverQueue)
        {
            return message.channel.send(`Il y a aucune musique en cours !`);
        }
    
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas connecté dans un salon vocal !`);
        }
    
        if(serverQueue.connection.dispatcher.resumed)
        {
            return message.channel.send(`La musique est déjà en cours !`);
        }
    
        serverQueue.connection.dispatcher.resume();
    
        message.channel.send(`La musique a bien été repris !`);
    }
    
    function loop(args, serverQueue)
    { 
        if(!args[1])
        {
            return message.channel.send(`<@${message.author.id}> Veuillez spécifier la loop que vous voulez: ${prefix}loop musique/queue/off`);
        }
    
        switch(args[1].toLowerCase())
        {
            case `queue`:
    
            serverQueue.loopqueue = !serverQueue.loopqueue;
            serverQueue.loopmusique = false;
    
            if(serverQueue.loopqueue == true)
            {
                message.channel.send(`La loop queue est activée !`);
            }
            else 
            {
                message.channel.send(`La loop queue est désactivée !`);
            }
    
            break;
    
            case `musique`:
    
            serverQueue.loopmusique = !serverQueue.loopmusique;
            serverQueue.loopqueue = false;
    
            if(serverQueue.loopmusique == true)
            {
                message.channel.send(`La loop musique est activée !`);
            }
            else 
            {
                message.channel.send(`La loop musique est désactivée !`);
            }
    
            break;
    
            case `off`:
    
            serverQueue.loopqueue = false;
            serverQueue.loopmusique = false;
    
            message.channel.send(`Loop désactivée !`);
    
            break;
        }
      }
    
    function queueMusic(serverQueue)
    {
        if(!serverQueue)
        {
            return message.channel.send(`Il y a aucune musique en cours !`);
        }
    
        if(!message.member.voice.channel)
        {
            return message.channel.send(`Vous n'êtes pas connecté dans un salon vocal !`);
        }
    
        let nowPlaying = serverQueue.songs[0];
        let qMsg = `Musique en cours: ${nowPlaying.title}\n-----------------------------------------------------\n`
    
        for(var i = 1; i < serverQueue.songs.length; i++)
        {
            qMsg += `${i}) ${serverQueue.songs[i].title}\n`
        }
        
        let embed = new discord.MessageEmbed()
        .setColor(`#00F6FE`)
        .setTitle(`**QUEUE**`)
        .setAuthor(`${message.member.displayName}#${message.author.discriminator}`, message.author.displayAvatarURL({ format: `png`, dynamic: true }))
        .setDescription(qMsg)
        .setThumbnail(message.guild.iconURL({ format: `png`, dynamic: true }))
        .setFooter(`H-Bot by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }))
        .setTimestamp();
        message.channel.send(embed);
    }
    
    async function finder(artiste, songName, message, pages)
    {
        let fullLyrics = await lyricsFinder(artiste, songName) || `Pas trouvé !`;
    
        for(let i = 0; i < fullLyrics.length; i += 2048)
        {
            const lyric = fullLyrics.substring(i, Math.min(fullLyrics.length, i + 2048));

            let embed = new discord.MessageEmbed()
            .setColor(`#00F6FE`)
            .setTitle(`**QUEUE**`)
            .setAuthor(`${message.member.displayName}#${message.author.discriminator}`, message.author.displayAvatarURL({ format: `png`, dynamic: true }))
            .setDescription(lyric)
            .setThumbnail(message.guild.iconURL({ format: `png`, dynamic: true }))
            .setFooter(`H-Bot by Niroshy#0426`, client.users.cache.get(BDD[`idNiroshy`]).displayAvatarURL({ format: `png`, dynamic: true }))
            .setTimestamp();
            pages.push(embed); 
        }
    }
    
});

client.on(`messageReactionAdd`, (reaction, user) =>
{
    if(user.bot)
    {
        return;
    }
    if((reaction.emoji.name == `🎁`) && (reaction.message.id == BDD[reaction.message.guild.id][`giveawayMessageID`]))
    {
        BDD[reaction.message.guild.id][`participantGiveaway`].push(user.id);
        saveBDD();
        user.send(`Tu as bien été enregistré pour le giveaway`).catch(() =>
        {
            return;
        });
    }
});

client.on(`messageReactionRemove`, (reaction, user) =>
{
    if(user.bot)
    {
        return;
    }
    if((reaction.emoji.name == `🎁`) && (reaction.message.id == BDD[reaction.message.guild.id][`giveawayMessageID`]))
    {
        let Index = BDD[reaction.message.guild.id][`participantGiveaway`].indexOf(user.id);
        if(Index > -1)
        {
            BDD[reaction.message.guild.id][`participantGiveaway`].splice(Index, 1);
            saveBDD();
            user.send(`Je t'ai retiré des participants au giveaway !`).catch(() =>
            {
                return;
            });
        }
    }   
});

function saveBDD()
    {
        fs.writeFile(`./../../../H-Bots/BaseDeDonnée.json`, JSON.stringify(BDD, null, 4), (err) =>
        {
            if(err)
            {
                console.log(`Problème avec la fonction de la base de donnée ! Pour plus de détails: ${err}`);
            }
        });
    }

client.login(``);