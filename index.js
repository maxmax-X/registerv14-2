
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Bot konfigürasyonu
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Prefix
const PREFIX = '.';

// Environment variables
const config = {
    token: process.env.DISCORD_BOT_TOKEN,
    clientId: process.env.CLIENT_ID,
    roles: {
        kayitsiz: process.env.KAYITSIZ_ROLE_ID,
        erkek: process.env.ERKEK_ROLE_ID,
        kadin: process.env.KADIN_ROLE_ID,
        yetkili: process.env.YETKILI_ROLE_ID,
        bot: process.env.BOT_ROLE_ID,
        tagli: process.env.TAGLI_ROLE_ID
    },
    channels: {
        register: process.env.REGISTER_CHANNEL_ID,
        registerInfo: process.env.REGISTER_INFO_CHANNEL_ID,
        log: process.env.LOG_CHANNEL_ID,
        welcome: process.env.WELCOME_CHANNEL_ID,
        general: process.env.GENERAL_CHANNEL_ID,
        tagLog: process.env.TAG_LOG_CHANNEL_ID
    },
    serverTag: process.env.SERVER_TAG || '★|'
};

// Veri saklama için basit JSON yapısı
let serverData = {};
const dataPath = path.join(__dirname, 'serverData.json');

// Kullanıcı uyarı verileri
let userWarnings = {};

// Veri yükleme fonksiyonu
function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            serverData = JSON.parse(data);
        }
    } catch (error) {
        console.log('Veri yüklenirken hata:', error);
        serverData = {};
    }
}

// Veri kaydetme fonksiyonu
function saveData() {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(serverData, null, 2));
    } catch (error) {
        console.log('Veri kaydedilirken hata:', error);
    }
}

// Role ID veya isim ile rol bulma fonksiyonu
function findRole(guild, roleIdOrName) {
    return guild.roles.cache.get(roleIdOrName) || guild.roles.cache.find(role => role.name === roleIdOrName);
}

// Channel ID veya isim ile kanal bulma fonksiyonu
function findChannel(guild, channelIdOrName) {
    return guild.channels.cache.get(channelIdOrName) || guild.channels.cache.find(ch => ch.name === channelIdOrName);
}

// Link tespiti için regex
const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// Reklam tespiti için regex (discord invite linkler)
const advertRegex = /(discord\.gg\/|discordapp\.com\/invite\/|discord\.com\/invite\/)[a-zA-Z0-9]+/gi;

// Everyone mention kontrolü
const everyoneMentionRegex = /@(everyone|here)/gi;

// Küfür kelimeleri listesi
const swearWords = [
    'amk', 'amq', 'amına', 'amınakoyim', 'amcık', 'aq', 'orospu', 'piç', 'sikik', 'sik', 'sikem', 'sikeyim', 'oç',
    'göt', 'götü', 'götün', 'yarrak', 'taşak', 'taşşak', 'am', 'amcığa', 'amcığı', 'amcığın', 'amcığını',
    'fuck', 'shit', 'damn', 'bitch', 'bastard', 'asshole', 'dick', 'pussy', 'cock', 'cunt', 'whore', 'slut',
    'porno', 'sex', 'seks', 'nude', 'nudes', 'çıplak', 'naked', 'xxx', 'porn', 'mastürbasyon', 'masturbation',
    'ibne', 'gay', 'lezbiyen', 'lesbian', 'homo', 'homosexual', 'transgender', 'trans', 'travesti', 'travestı',
    'salak', 'aptal', 'gerizekalı', 'mal', 'cahil', 'stupid', 'idiot', 'moron', 'dumb', 'retard', 'retarded',
    'pezevenk', 'puşt', 'kaltak', 'fahişe', 'sürtük', 'orospuçocuğu', 'piçkurusu', 'götveren', 'sikişmek',
    'becermek', 'düzmek', 'pompalamak', 'çakmak', 'sokmak', 'sikmek', 'gotten', 'götden', 'anal', 'vajina',
    'penis', 'testis', 'klitoris', 'döl', 'sperm', 'prezervatif', 'kondom', 'vibratör', 'dildo', 'sikiş',
    'bok', 'kaka', 'pislik', 'leş', 'çürük', 'iğrenç', 'tiksindirici', 'mide', 'kusmuk', 'kusacağım',
    'allah', 'muhammed', 'jesus', 'christ', 'tanrı', 'god', 'din', 'religion', 'bible', 'kuran', 'incil',
    'şeytan', 'satan', 'devil', 'demon', 'cehennem', 'hell', 'cennet', 'heaven', 'peygamber', 'prophet',
    'ananı', 'babanı', 'karını', 'kızını', 'oğlunu', 'your mom', 'your mother', 'your dad', 'your father',
    'ananın', 'babanın', 'karının', 'kızının', 'oğlunun', 'aileni', 'family', 'anne', 'baba', 'mother', 'father'
];

// Küfür kontrolü fonksiyonu
function containsSwearWord(text) {
    const lowerText = text.toLowerCase();
    return swearWords.some(word => {
        // Kelime sınırları ile tam eşleşme
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
}

// Kullanıcı uyarısı ekleme fonksiyonu
function addWarning(guildId, userId, type) {
    if (!userWarnings[guildId]) userWarnings[guildId] = {};
    if (!userWarnings[guildId][userId]) userWarnings[guildId][userId] = { link: 0, advert: 0, everyone: 0, swear: 0 };
    
    userWarnings[guildId][userId][type]++;
    return userWarnings[guildId][userId][type];
}

// Mute rolü oluşturma fonksiyonu
async function createMuteRole(guild) {
    try {
        let muteRole = guild.roles.cache.find(role => role.name === 'Muted');
        
        if (!muteRole) {
            muteRole = await guild.roles.create({
                name: 'Muted',
                color: '#424242',
                permissions: [],
                reason: 'Otomatik oluşturulan mute rolü'
            });

            // Tüm kanallarda Muted rolüne yazma iznini kapat
            guild.channels.cache.forEach(async (channel) => {
                try {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false,
                        Connect: false
                    });
                } catch (error) {
                    console.log(`Mute rolü izni ayarlanamadı: ${channel.name}`);
                }
            });
        }
        
        return muteRole;
    } catch (error) {
        console.log('Mute rolü oluşturulamadı:', error);
        return null;
    }
}

// Mute kanalı oluşturma fonksiyonu
async function createMuteChannel(guild) {
    try {
        let muteChannel = guild.channels.cache.find(ch => ch.name === 'mute-cezalı');
        
        if (!muteChannel) {
            muteChannel = await guild.channels.create({
                name: 'mute-cezalı',
                type: ChannelType.GuildText,
                reason: 'Otomatik oluşturulan mute kanalı'
            });

            // Sadece muted rolü olan kişiler görebilsin
            const muteRole = guild.roles.cache.find(role => role.name === 'Muted');
            const everyoneRole = guild.roles.everyone;

            await muteChannel.permissionOverwrites.set([
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: muteRole?.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages]
                }
            ]);
        }
        
        return muteChannel;
    } catch (error) {
        console.log('Mute kanalı oluşturulamadı:', error);
        return null;
    }
}

// Bot hazır olduğunda
client.once('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    loadData();
});

// Yeni üye geldiğinde
client.on('guildMemberAdd', async (member) => {
    const guildId = member.guild.id;
    const data = serverData[guildId];
    
    try {
        // Bot ise Bot rolü ver
        if (member.user.bot) {
            const botRole = findRole(member.guild, config.roles.bot) || findRole(member.guild, 'Bot');
            if (botRole) {
                await member.roles.add(botRole);
            }
        } else {
            // Normal üyelere Kayıtsız rolü ver
            const unregisteredRole = findRole(member.guild, config.roles.kayitsiz) || findRole(member.guild, 'Kayıtsız');
            if (unregisteredRole) {
                await member.roles.add(unregisteredRole);
            }
        }

        // Gelen-giden kanalına mesaj at
        const welcomeChannel = findChannel(member.guild, config.channels.welcome) || findChannel(member.guild, 'gelen-giden');
        if (welcomeChannel) {
            const memberCount = member.guild.memberCount;
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎉 Hoş Geldin!')
                .setDescription(`**${member.user.tag}** sunucuya katıldı! **${memberCount}** üye olduk!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${member.user.id}>`, inline: true },
                    { name: '🆔 ID', value: member.user.id, inline: true },
                    { name: '📅 Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '📊 Toplam Üye', value: `**${memberCount}** kişi`, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil' });

            await welcomeChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.log('Üye geldiğinde hata:', error);
    }
});

// Üye ayrıldığında
client.on('guildMemberRemove', async (member) => {
    const guildId = member.guild.id;
    const data = serverData[guildId];
    
    try {
        const leaveChannel = findChannel(member.guild, config.channels.welcome) || findChannel(member.guild, 'gelen-giden');
        if (leaveChannel) {
            const memberCount = member.guild.memberCount;
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('👋 Güle Güle!')
                .setDescription(`**${member.user.tag}** sunucudan ayrıldı! **${memberCount}** kişi kaldık!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: member.user.tag, inline: true },
                    { name: '🆔 ID', value: member.user.id, inline: true },
                    { name: '📊 Kalan Üye', value: `**${memberCount}** kişi`, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil' });

            await leaveChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.log('Üye ayrılırken hata:', error);
    }
});

// Mesaj geldiğinde (komut işleme)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const messageGuildId = message.guild?.id;
    const data = serverData[messageGuildId] || {};

    // Admin kontrolü için yardımcı fonksiyon
    const isAdmin = (member) => {
        return member.permissions.has(PermissionFlagsBits.Administrator);
    };

    // Eğer admin değilse ve kontrol sistemleri açıksa
    if (!isAdmin(message.member) && message.guild) {
        let shouldDelete = false;
        let warningType = '';
        let warningMessage = '';

        // Küfür kontrolü
        if (data.antiSwear && containsSwearWord(message.content)) {
            // Eğer daha önce mute edilmişse direkt at
            if (userWarnings[messageGuildId] && userWarnings[messageGuildId][message.author.id] && userWarnings[messageGuildId][message.author.id].wasMuted) {
                try {
                    await message.delete().catch(() => {});
                    await message.member.ban({ reason: 'Mute sonrası küfür kullanımı devam etti' });
                    
                    const banEmbed = new EmbedBuilder()
                        .setColor('#8b0000')
                        .setTitle('🔨 Kullanıcı Sunucudan Atıldı!')
                        .setDescription(`**${message.author.tag}** mute sonrası küfür kullanmaya devam ettiği için sunucudan atıldı!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
                            { name: '📝 Sebep', value: 'Mute sonrası küfür devam', inline: true },
                            { name: '⚠️ Uyarı', value: 'Final ceza uygulandı', inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                    await message.channel.send({ embeds: [banEmbed] });
                    return;
                } catch (error) {
                    console.log('Ban hatası:', error);
                }
            }

            const warnings = addWarning(messageGuildId, message.author.id, 'swear');
            shouldDelete = true;
            warningType = 'swear';
            
            if (warnings >= 3) {
                // Mute işlemi
                await handleMute(message, 'Küfür Kullanımı', data.swearMuteDuration || 600); // 10 dakika default
                return;
            } else {
                warningMessage = `⚠️ **${message.author.tag}** küfür tespit edildi! **${warnings}/3** uyarı`;
            }
        }

        // Link kontrolü
        if (data.antiLink && linkRegex.test(message.content)) {
            // Eğer daha önce mute edilmişse direkt at
            if (userWarnings[messageGuildId] && userWarnings[messageGuildId][message.author.id] && userWarnings[messageGuildId][message.author.id].wasMuted) {
                try {
                    await message.delete().catch(() => {});
                    await message.member.ban({ reason: 'Mute sonrası link spamı devam etti' });
                    
                    const banEmbed = new EmbedBuilder()
                        .setColor('#8b0000')
                        .setTitle('🔨 Kullanıcı Sunucudan Atıldı!')
                        .setDescription(`**${message.author.tag}** mute sonrası link paylaşmaya devam ettiği için sunucudan atıldı!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
                            { name: '📝 Sebep', value: 'Mute sonrası link spamı devam', inline: true },
                            { name: '⚠️ Uyarı', value: 'Final ceza uygulandı', inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                    await message.channel.send({ embeds: [banEmbed] });
                    return;
                } catch (error) {
                    console.log('Ban hatası:', error);
                }
            }

            const warnings = addWarning(messageGuildId, message.author.id, 'link');
            shouldDelete = true;
            warningType = 'link';
            
            if (warnings >= 3) {
                // Mute işlemi
                await handleMute(message, 'Link Spamı', data.linkMuteDuration || 600); // 10 dakika default
                return;
            } else {
                warningMessage = `⚠️ **${message.author.tag}** link paylaşımı tespit edildi! **${warnings}/3** uyarı`;
            }
        }

        // Reklam kontrolü
        if (data.antiAdvert && advertRegex.test(message.content)) {
            // Eğer daha önce mute edilmişse direkt at
            if (userWarnings[messageGuildId] && userWarnings[messageGuildId][message.author.id] && userWarnings[messageGuildId][message.author.id].wasMuted) {
                try {
                    await message.delete().catch(() => {});
                    await message.member.ban({ reason: 'Mute sonrası reklam spamı devam etti' });
                    
                    const banEmbed = new EmbedBuilder()
                        .setColor('#8b0000')
                        .setTitle('🔨 Kullanıcı Sunucudan Atıldı!')
                        .setDescription(`**${message.author.tag}** mute sonrası reklam yapmaya devam ettiği için sunucudan atıldı!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
                            { name: '📝 Sebep', value: 'Mute sonrası reklam spamı devam', inline: true },
                            { name: '⚠️ Uyarı', value: 'Final ceza uygulandı', inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                    await message.channel.send({ embeds: [banEmbed] });
                    return;
                } catch (error) {
                    console.log('Ban hatası:', error);
                }
            }

            const warnings = addWarning(messageGuildId, message.author.id, 'advert');
            shouldDelete = true;
            warningType = 'advert';
            
            if (warnings >= 3) {
                // Mute işlemi
                await handleMute(message, 'Reklam Spamı', data.advertMuteDuration || 600); // 10 dakika default
                return;
            } else {
                warningMessage = `⚠️ **${message.author.tag}** reklam paylaşımı tespit edildi! **${warnings}/3** uyarı`;
            }
        }

        // Everyone mention kontrolü
        if (data.antiEveryone && everyoneMentionRegex.test(message.content)) {
            // Eğer daha önce mute edilmişse direkt at
            if (userWarnings[messageGuildId] && userWarnings[messageGuildId][message.author.id] && userWarnings[messageGuildId][message.author.id].wasMuted) {
                try {
                    await message.delete().catch(() => {});
                    await message.member.ban({ reason: 'Mute sonrası everyone spamı devam etti' });
                    
                    const banEmbed = new EmbedBuilder()
                        .setColor('#8b0000')
                        .setTitle('🔨 Kullanıcı Sunucudan Atıldı!')
                        .setDescription(`**${message.author.tag}** mute sonrası everyone spamına devam ettiği için sunucudan atıldı!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `${message.author.tag}`, inline: true },
                            { name: '📝 Sebep', value: 'Mute sonrası everyone spamı devam', inline: true },
                            { name: '⚠️ Uyarı', value: 'Final ceza uygulandı', inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                    await message.channel.send({ embeds: [banEmbed] });
                    return;
                } catch (error) {
                    console.log('Ban hatası:', error);
                }
            }

            const warnings = addWarning(messageGuildId, message.author.id, 'everyone');
            shouldDelete = true;
            warningType = 'everyone';
            
            if (warnings >= 3) {
                // Mute işlemi
                await handleMute(message, 'Everyone Spamı', data.everyoneMuteDuration || 600); // 10 dakika default
                return;
            } else {
                warningMessage = `⚠️ **${message.author.tag}** everyone/here kullanımı tespit edildi! **${warnings}/3** uyarı`;
            }
        }

        // Mesajı sil ve uyarı gönder
        if (shouldDelete) {
            try {
                await message.delete();
                
                const warningEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('🚫 Otomatik Moderasyon')
                    .setDescription(warningMessage)
                    .addFields(
                        { name: '👤 Kullanıcı', value: `<@${message.author.id}>`, inline: true },
                        { name: '📝 İhlal Türü', value: warningType === 'link' ? 'Link Paylaşımı' : warningType === 'advert' ? 'Reklam Paylaşımı' : warningType === 'everyone' ? 'Everyone Mention' : 'Küfür Kullanımı', inline: true },
                        { name: '⚠️ Kalan Uyarı', value: `${3 - (warningType === 'link' ? userWarnings[messageGuildId][message.author.id].link : warningType === 'advert' ? userWarnings[messageGuildId][message.author.id].advert : warningType === 'everyone' ? userWarnings[messageGuildId][message.author.id].everyone : userWarnings[messageGuildId][message.author.id].swear)} uyarı`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                const warningMsg = await message.channel.send({ embeds: [warningEmbed] });
                
                // 5 saniye sonra uyarı mesajını sil
                setTimeout(() => {
                    warningMsg.delete().catch(() => {});
                }, 5000);

            } catch (error) {
                console.log('Mesaj silme hatası:', error);
            }
        }
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const guildId = message.guild.id;

    // Mute işlemi fonksiyonu
    async function handleMute(message, reason, duration) {
        try {
            const muteRole = await createMuteRole(message.guild);
            const muteChannel = await createMuteChannel(message.guild);
            
            if (!muteRole) return;

            await message.member.roles.add(muteRole);
            await message.delete().catch(() => {});

            const muteEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔇 Otomatik Mute!')
                .setDescription(`**${message.author.tag}** 3 uyarı aldığı için mute edildi!`)
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${message.author.id}>`, inline: true },
                    { name: '📝 Sebep', value: reason, inline: true },
                    { name: '⏰ Süre', value: `${Math.floor(duration / 60)} dakika`, inline: true },
                    { name: '🔇 Durum', value: 'Mute kanalına yönlendirildi', inline: false },
                    { name: '⚠️ Uyarı', value: 'Mute sonrası tekrar ihlal = Sunucudan atılma!', inline: false }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil' });

            await message.channel.send({ embeds: [muteEmbed] });

            // Mute kanalına bildirim
            if (muteChannel) {
                const muteChannelEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('🔇 Mute Bildirim')
                    .setDescription(`**${message.author.tag}** ${reason} nedeniyle mute edildin!`)
                    .addFields(
                        { name: '⏰ Mute Süresi', value: `${Math.floor(duration / 60)} dakika`, inline: true },
                        { name: '📝 Sebep', value: reason, inline: true },
                        { name: '💡 Bilgi', value: 'Mute süren bittiğinde otomatik olarak kaldırılacak.', inline: false },
                        { name: '⚠️ DİKKAT', value: 'Mute bittikten sonra tekrar aynı ihlali yaparsan sunucudan atılacaksın!', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil' });

                await muteChannel.send({ embeds: [muteChannelEmbed] });
            }

            // Kullanıcıyı mute edilmiş olarak işaretle
            if (!userWarnings[guildId][message.author.id].wasMuted) {
                userWarnings[guildId][message.author.id].wasMuted = true;
            }

            // Belirtilen süre sonra mute'u kaldır
            setTimeout(async () => {
                try {
                    const member = message.guild.members.cache.get(message.author.id);
                    if (member && member.roles.cache.has(muteRole.id)) {
                        await member.roles.remove(muteRole);
                        
                        const unmuteEmbed = new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('🔊 Mute Kaldırıldı!')
                            .setDescription(`**${message.author.tag}** mute'u otomatik olarak kaldırıldı!`)
                            .addFields(
                                { name: '⚠️ Son Uyarı', value: 'Artık herhangi bir ihlal yaparsan direkt sunucudan atılacaksın!', inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil' });

                        message.channel.send({ embeds: [unmuteEmbed] });

                        // Uyarıları sıfırla ama mute geçmişini koru
                        if (userWarnings[guildId] && userWarnings[guildId][message.author.id]) {
                            userWarnings[guildId][message.author.id] = { 
                                link: 0, 
                                advert: 0, 
                                everyone: 0, 
                                swear: 0,
                                wasMuted: true 
                            };
                        }
                    }
                } catch (error) {
                    console.log('Mute kaldırma hatası:', error);
                }
            }, duration * 1000);

        } catch (error) {
            console.log('Mute işlemi hatası:', error);
        }
    }

    // Setup komutu
    if (command === 'setup') {
        if (!isAdmin(message.member)) {
            const noPermEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('🚫 Yetkisiz Erişim')
                .setDescription('Bu komutu kullanmak için **Administrator** iznine sahip olmalısınız!')
                .addFields(
                    { name: '⚠️ Gerekli İzin', value: '`Administrator`', inline: true },
                    { name: '👤 Mevcut İzin', value: 'Yetersiz', inline: true }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1074004662932082760.png')
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil', iconURL: message.guild.iconURL() });
            return message.reply({ embeds: [noPermEmbed] });
        }

        try {
            // Veri yapısını başlat
            if (!serverData[guildId]) {
                serverData[guildId] = {};
            }

            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('⚙️ Sunucu Kurulumu Başlatılıyor...')
                .setDescription('```yaml\n🔄 Kurulum işlemi başlatılıyor...\n⏳ Lütfen bekleyiniz...\n```')
                .addFields(
                    { name: '🎯 İşlem', value: 'Sunucu Otomatik Kurulum', inline: true },
                    { name: '👨‍💻 Geliştirici', value: 'Xedevil', inline: true },
                    { name: '⏱️ Süre', value: '~30 saniye', inline: true }
                )
                .setThumbnail(message.guild.iconURL())
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil • Setup v2.0', iconURL: message.author.displayAvatarURL() });

            const setupMsg = await message.reply({ embeds: [embed] });

            // Rolleri oluştur
            const rolesToCreate = [
                { name: 'Kayıtsız', color: '#99aab5' },
                { name: 'Erkek', color: '#3498db' },
                { name: 'Kadın', color: '#e91e63' },
                { name: 'Bot', color: '#9b59b6' },
                { name: 'Yetkili', color: '#e74c3c' },
                { name: 'Taglı', color: '#f1c40f' }
            ];

            for (const roleData of rolesToCreate) {
                const existingRole = message.guild.roles.cache.find(role => role.name === roleData.name);
                if (!existingRole) {
                    await message.guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        reason: 'Setup komutu ile otomatik oluşturuldu'
                    });
                }
            }

            // Kanalları oluştur
            const channelsToCreate = [
                { name: 'register', type: ChannelType.GuildText },
                { name: 'register-info', type: ChannelType.GuildText },
                { name: 'tag-log', type: ChannelType.GuildText },
                { name: 'genel', type: ChannelType.GuildText },
                { name: 'gelen-giden', type: ChannelType.GuildText },
                { name: 'log', type: ChannelType.GuildText }
            ];

            for (const channelData of channelsToCreate) {
                const existingChannel = message.guild.channels.cache.find(ch => ch.name === channelData.name);
                if (!existingChannel) {
                    const channel = await message.guild.channels.create({
                        name: channelData.name,
                        type: channelData.type,
                        reason: 'Setup komutu ile otomatik oluşturuldu'
                    });

                    // Kanal izinlerini ayarla
                    const unregisteredRole = findRole(message.guild, 'Kayıtsız');
                    const erkekRole = findRole(message.guild, 'Erkek');
                    const kadinRole = findRole(message.guild, 'Kadın');
                    const staffRole = findRole(message.guild, 'Yetkili');
                    const everyoneRole = message.guild.roles.everyone;

                    if (channelData.name === 'register') {
                        await channel.permissionOverwrites.set([
                            {
                                id: everyoneRole.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: unregisteredRole.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                            },
                            {
                                id: staffRole.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
                            }
                        ]);
                    } else if (channelData.name === 'register-info') {
                        await channel.permissionOverwrites.set([
                            {
                                id: everyoneRole.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: unregisteredRole.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                id: staffRole.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
                            }
                        ]);

                        // Register-info kanalına kurallar embed'i gönder
                        const rulesEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('📋 Sunucu Kuralları | Server Rules')
                            .setDescription('**🇹🇷 Türkçe:** Sunucumuza hoş geldiniz! Aşağıdaki kuralları dikkatli bir şekilde okuyup onayladıktan sonra sunucuya tam erişim sağlayabilirsiniz.\n\n**🇺🇸 English:** Welcome to our server! Please read the following rules carefully and confirm them to gain full access to the server.')
                            .addFields(
                                { 
                                    name: '1️⃣ Saygı ve Nezaket | Respect and Courtesy', 
                                    value: '**🇹🇷** Tüm üyelere saygılı davranın, hakaret, küfür ve aşağılama yasaktır. Farklı görüşlere tolerans gösterin.\n**🇺🇸** Be respectful to all members, insults, swearing and humiliation are prohibited. Show tolerance to different opinions.', 
                                    inline: false 
                                },
                                { 
                                    name: '2️⃣ Spam ve Flood Yasağı | No Spam & Flood', 
                                    value: '**🇹🇷** Gereksiz mesaj tekrarı, emoji spamı, büyük harf kullanımı ve anlamsız mesajlar göndermeyin. Ses kanallarında müzik spamı yapmayın.\n**🇺🇸** Do not send unnecessary message repetition, emoji spam, excessive caps lock usage and meaningless messages. Do not spam music in voice channels.', 
                                    inline: false 
                                },
                                { 
                                    name: '3️⃣ İçerik Politikası | Content Policy', 
                                    value: '**🇹🇷** NSFW, şiddet, nefret söylemi, reklam ve 18+ içerik paylaşmayın. Telif hakkı korumalı materyal paylaşımı yasaktır.\n**🇺🇸** Do not share NSFW, violence, hate speech, advertising and 18+ content. Sharing copyrighted material is prohibited.', 
                                    inline: false 
                                },
                                { 
                                    name: '4️⃣ Kanal Kuralları | Channel Rules', 
                                    value: '**🇹🇷** Her kanalın kendine özgü kurallarına uyun. Konuları ilgili kanallarda tartışın. Ses kanallarında rahatsız edici sesler çıkarmayın.\n**🇺🇸** Follow the specific rules of each channel. Discuss topics in relevant channels. Do not make disturbing sounds in voice channels.', 
                                    inline: false 
                                },
                                { 
                                    name: '5️⃣ Kişisel Bilgi Gizliliği | Privacy', 
                                    value: '**🇹🇷** Kendi ve başkalarının kişisel bilgilerini (telefon, adres, vb.) paylaşmayın. Özel bilgileri halka açık kanallarda tartışmayın.\n**🇺🇸** Do not share your own or others\' personal information (phone, address, etc.). Do not discuss private information in public channels.', 
                                    inline: false 
                                },
                                { 
                                    name: '6️⃣ Alternatif Hesap | Alternative Accounts', 
                                    value: '**🇹🇷** Alternatif hesap (alt account) kullanımı yasaktır. Tespit edildiğinde tüm hesaplar yasaklanacaktır.\n**🇺🇸** Using alternative accounts (alt accounts) is prohibited. When detected, all accounts will be banned.', 
                                    inline: false 
                                },
                                { 
                                    name: '7️⃣ Yetkili Saygısı | Staff Respect', 
                                    value: '**🇹🇷** Yetkililerin kararlarına saygı gösterin. İtirazınız varsa özel mesaj ile iletişime geçin. Yetkili taklidi yapmayın.\n**🇺🇸** Respect staff decisions. If you have objections, contact via private message. Do not impersonate staff members.', 
                                    inline: false 
                                },
                                { 
                                    name: '8️⃣ Dış Bağlantılar | External Links', 
                                    value: '**🇹🇷** Yetkili onayı olmadan Discord sunucu davetleri ve şüpheli linkler paylaşmayın. Dolandırıcılık linkleri kesinlikle yasaktır.\n**🇺🇸** Do not share Discord server invites and suspicious links without staff approval. Scam links are strictly prohibited.', 
                                    inline: false 
                                },
                                { 
                                    name: '⚖️ Ceza Sistemi | Punishment System', 
                                    value: '**🇹🇷** Kurallara uymayan üyeler: 1. Uyarı, 2. Susturma, 3. Geçici Yasaklama, 4. Kalıcı Yasaklama cezaları alır.\n**🇺🇸** Members who do not follow rules will receive: 1. Warning, 2. Mute, 3. Temporary Ban, 4. Permanent Ban.', 
                                    inline: false 
                                },
                                { 
                                    name: '📞 İletişim | Contact', 
                                    value: '**🇹🇷** Sorularınız için yetkililere özel mesaj atabilir veya destek sistemi kullanabilirsiniz.\n**🇺🇸** For questions, you can send private messages to staff or use the support system.', 
                                    inline: false 
                                }
                            )
                            .setFooter({ text: 'Made and Developed by Xedevil | Kuralları kabul ederek devam edin' });

                        const confirmButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('confirm_rules')
                                    .setLabel('✅ Okudum, Onayladım')
                                    .setStyle(ButtonStyle.Success)
                            );

                        await channel.send({ embeds: [rulesEmbed], components: [confirmButton] });

                    } else if (channelData.name === 'tag-log' || channelData.name === 'log') {
                        await channel.permissionOverwrites.set([
                            {
                                id: everyoneRole.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.SendMessages]
                            },
                            {
                                id: staffRole.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
                            }
                        ]);
                    }
                }
            }

            // Sunucu verilerine tag ekle
            serverData[guildId].tag = config.serverTag;
            serverData[guildId].footerText = 'Made and Developed by Xedevil';
            saveData();

            // Kurulum tamamlandı mesajı
            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Kurulum Başarıyla Tamamlandı!')
                .setDescription('```diff\n+ Sunucu kurulumu başarıyla tamamlandı!\n+ Tüm roller ve kanallar oluşturuldu.\n+ Sistem aktif ve kullanıma hazır!\n```')
                .addFields(
                    { 
                        name: '🎭 Oluşturulan Roller', 
                        value: '```\n• Kayıtsız (Gri)\n• Erkek (Mavi)\n• Kadın (Pembe)\n• Bot (Mor)\n• Yetkili (Kırmızı)\n• Taglı (Sarı)\n```', 
                        inline: true 
                    },
                    { 
                        name: '📝 Oluşturulan Kanallar', 
                        value: '```\n• #register\n• #register-info\n• #tag-log\n• #genel\n• #gelen-giden\n• #log\n```', 
                        inline: true 
                    },
                    { 
                        name: '🏷️ Sunucu Ayarları', 
                        value: `\`\`\`\nTag: ${config.serverTag}\nDurum: ✅ Aktif\nSürüm: v2.0\n\`\`\``, 
                        inline: false 
                    }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1074004608665653338.gif')
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil • Kurulum Tamamlandı', iconURL: message.guild.iconURL() });

            await setupMsg.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.log('Setup hatası:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Kurulum Hatası!')
                .setDescription('```yaml\nHata: Kurulum sırasında beklenmedik bir hata oluştu\nÇözüm: Lütfen bot izinlerini kontrol edin\n```')
                .addFields(
                    { name: '🔧 Önerilen Çözümler', value: '• Bot izinlerini kontrol edin\n• Sunucu ayarlarını gözden geçirin\n• Tekrar deneyin', inline: false }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1074004662932082760.png')
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil', iconURL: message.author.displayAvatarURL() });
            message.reply({ embeds: [errorEmbed] });
        }
    }

    // Tag ayarlama komutu
    if (command === 'tag') {
        if (!isAdmin(message.member)) {
            const noPermEmbed = new EmbedBuilder()
                .setColor('#ff4757')
                .setTitle('🚫 Yetkisiz Erişim')
                .setDescription('Bu komutu kullanmak için **Administrator** iznine sahip olmalısınız!')
                .addFields(
                    { name: '⚠️ Gerekli İzin', value: '`Administrator`', inline: true },
                    { name: '👤 Mevcut İzin', value: 'Yetersiz', inline: true }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1074004662932082760.png')
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil', iconURL: message.guild.iconURL() });
            return message.reply({ embeds: [noPermEmbed] });
        }

        const tag = args.join(' ');
        if (!tag) {
            const usageEmbed = new EmbedBuilder()
                .setColor('#ff9f43')
                .setTitle('⚠️ Yanlış Kullanım')
                .setDescription('Lütfen bir tag belirtin!')
                .addFields(
                    { name: '📝 Doğru Kullanım', value: `\`.tag ${config.serverTag}\``, inline: false },
                    { name: '💡 Örnek', value: '`.tag ★|` veya `.tag [TAG]`', inline: false }
                )
                .setThumbnail('https://cdn.discordapp.com/emojis/1074004691079667752.png')
                .setTimestamp()
                .setFooter({ text: 'Made and Developed by Xedevil', iconURL: message.author.displayAvatarURL() });
            return message.reply({ embeds: [usageEmbed] });
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        const oldTag = serverData[guildId].tag || 'Yok';
        serverData[guildId].tag = tag;
        saveData();

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🏷️ Tag Başarıyla Güncellendi!')
            .setDescription('```diff\n+ Sunucu tagı başarıyla ayarlandı!\n+ Artık bu tag kullanılacak.\n```')
            .addFields(
                { name: '🏷️ Eski Tag', value: `\`${oldTag}\``, inline: true },
                { name: '🆕 Yeni Tag', value: `\`${tag}\``, inline: true },
                { name: '👨‍💻 Güncelleyen', value: `<@${message.author.id}>`, inline: true },
                { name: '💡 Bilgi', value: 'Bu tag, yeni üye kayıtlarında otomatik olarak kullanılacaktır.', inline: false }
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/1074004608665653338.gif')
            .setTimestamp()
            .setFooter({ text: 'Made and Developed by Xedevil • Tag Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Register komutu (erkek/kadın kaydı)
    if (command === 'register' || command === 'e' || command === 'k') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const user = message.mentions.users.first();
        const name = args.slice(1).join(' ');

        if (!user || !name) {
            return message.reply(`❌ Kullanım: \`.${command} @kullanıcı <isim>\``);
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Kullanıcı bulunamadı!');
        }

        try {
            const unregisteredRole = findRole(message.guild, config.roles.kayitsiz) || findRole(message.guild, 'Kayıtsız');
            let genderRole;
            let genderText;

            if (command === 'e') {
                genderRole = findRole(message.guild, config.roles.erkek) || findRole(message.guild, 'Erkek');
                genderText = 'Erkek';
            } else if (command === 'k') {
                genderRole = findRole(message.guild, config.roles.kadin) || findRole(message.guild, 'Kadın');
                genderText = 'Kadın';
            } else {
                return message.reply('❌ Cinsiyet belirtmelisiniz! Kullanım: `.e @kullanıcı <isim>` veya `.k @kullanıcı <isim>`');
            }

            if (unregisteredRole) await member.roles.remove(unregisteredRole);
            if (genderRole) await member.roles.add(genderRole);

            const data = serverData[guildId];
            let newNickname = name;
            
            if (data && data.tag && user.username.includes(data.tag)) {
                newNickname = `${data.tag} ${name}`;
                
                // Taglı rolü ver
                const tagliRole = findRole(message.guild, config.roles.tagli) || findRole(message.guild, 'Taglı');
                if (tagliRole) await member.roles.add(tagliRole);
                
                // Tag log kanalına bildir
                const tagLogChannel = findChannel(message.guild, config.channels.tagLog) || findChannel(message.guild, 'tag-log');
                if (tagLogChannel) {
                    const tagEmbed = new EmbedBuilder()
                        .setColor('#ffd700')
                        .setTitle('🏷️ Taglı Üye Kaydı')
                        .setDescription(`**${user.tag}** taglı olarak kaydedildi!`)
                        .addFields(
                            { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
                            { name: '📝 İsim', value: newNickname, inline: true },
                            { name: '⚧️ Cinsiyet', value: genderText, inline: true },
                            { name: '👮 Yetkili', value: `<@${message.author.id}>`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: data.footerText || 'Made and Developed by Xedevil' });

                    await tagLogChannel.send({ embeds: [tagEmbed] });
                }
            }

            await member.setNickname(newNickname);

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Kayıt İşlemi Tamamlandı!')
                .setDescription('```diff\n+ Kullanıcı başarıyla kaydedildi!\n+ Roller ve isim güncellendi.\n```')
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${user.id}>\n\`${user.tag}\``, inline: true },
                    { name: '📝 Yeni İsim', value: `\`${newNickname}\``, inline: true },
                    { name: '⚧️ Cinsiyet', value: `${genderText === 'Erkek' ? '♂️' : '♀️'} ${genderText}`, inline: true },
                    { name: '👮 Kayıt Eden', value: `<@${message.author.id}>`, inline: true },
                    { name: '⏰ Kayıt Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🆔 User ID', value: `\`${user.id}\``, inline: true }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTimestamp()
                .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil • Kayıt Sistemi', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [embed] });

            // Log kanalına kayıt logu
            const logChannel = findChannel(message.guild, config.channels.log) || findChannel(message.guild, 'log');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('📝 Kayıt Logu')
                    .setDescription(`Yeni üye kaydı gerçekleştirildi`)
                    .addFields(
                        { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
                        { name: '📝 İsim', value: newNickname, inline: true },
                        { name: '⚧️ Cinsiyet', value: genderText, inline: true },
                        { name: '👮 Yetkili', value: `<@${message.author.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil' });

                await logChannel.send({ embeds: [logEmbed] });
            }

            // Genel kanala hoş geldin mesajı
            const generalChannel = findChannel(message.guild, config.channels.general) || findChannel(message.guild, 'genel');
            if (generalChannel) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 Yeni Üye!')
                    .setDescription(`**${newNickname}** sunucumuza hoş geldin!`)
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil' });

                await generalChannel.send({ embeds: [welcomeEmbed] });
            }

        } catch (error) {
            console.log('Register hatası:', error);
            message.reply('❌ Kayıt sırasında bir hata oluştu!');
        }
    }

    // Name komutu
    if (command === 'name') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const user = message.mentions.users.first();
        const newName = args.slice(1).join(' ');

        if (!user || !newName) {
            return message.reply('❌ Kullanım: `.name @kullanıcı <yeni isim>`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Kullanıcı bulunamadı!');
        }

        try {
            const data = serverData[guildId];
            let finalName = newName;
            
            if (data && data.tag && user.username.includes(data.tag)) {
                finalName = `${data.tag} ${newName}`;
            }

            await member.setNickname(finalName);

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('✏️ İsim Başarıyla Güncellendi!')
                .setDescription('```diff\n+ Kullanıcının ismi başarıyla değiştirildi!\n```')
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${user.id}>\n\`${user.tag}\``, inline: true },
                    { name: '📝 Yeni İsim', value: `\`${finalName}\``, inline: true },
                    { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true },
                    { name: '⏰ Güncelleme Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '💡 Bilgi', value: 'İsim değişikliği başarıyla uygulandı.', inline: false }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTimestamp()
                .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil • İsim Sistemi', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.log('Name hatası:', error);
            message.reply('❌ İsim değiştirme sırasında bir hata oluştu!');
        }
    }

    // Unregistered komutu
    if (command === 'unregistered') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Kullanım: `.unregistered @kullanıcı`');
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('❌ Kullanıcı bulunamadı!');
        }

        try {
            const unregisteredRole = findRole(message.guild, config.roles.kayitsiz) || findRole(message.guild, 'Kayıtsız');
            const erkekRole = findRole(message.guild, config.roles.erkek) || findRole(message.guild, 'Erkek');
            const kadinRole = findRole(message.guild, config.roles.kadin) || findRole(message.guild, 'Kadın');
            const tagliRole = findRole(message.guild, config.roles.tagli) || findRole(message.guild, 'Taglı');

            if (erkekRole) await member.roles.remove(erkekRole);
            if (kadinRole) await member.roles.remove(kadinRole);
            if (tagliRole) await member.roles.remove(tagliRole);
            if (unregisteredRole) await member.roles.add(unregisteredRole);

            await member.setNickname(null);

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🗑️ Kayıt Başarıyla Silindi!')
                .setDescription('```diff\n- Kullanıcının kaydı başarıyla silindi!\n- Tüm roller kaldırıldı.\n```')
                .addFields(
                    { name: '👤 Kullanıcı', value: `<@${user.id}>\n\`${user.tag}\``, inline: true },
                    { name: '👮 Silen Yetkili', value: `<@${message.author.id}>`, inline: true },
                    { name: '⏰ Silme Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🔄 Yapılan İşlemler', value: '• Cinsiyet rolleri kaldırıldı\n• Taglı rolü kaldırıldı\n• Kayıtsız rolü verildi\n• İsim sıfırlandı', inline: false }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTimestamp()
                .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil • Kayıt Sistemi', iconURL: message.guild.iconURL() });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.log('Unregistered hatası:', error);
            message.reply('❌ Kayıt silme sırasında bir hata oluştu!');
        }
    }

    // Anti-link komutu
    if (command === 'anti-link') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const action = args[0];
        if (!action || !['aç', 'kapa'].includes(action)) {
            return message.reply('❌ Kullanım: `.anti-link aç` veya `.anti-link kapa`');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        serverData[guildId].antiLink = action === 'aç';
        saveData();

        const embed = new EmbedBuilder()
            .setColor(action === 'aç' ? '#2ecc71' : '#e74c3c')
            .setTitle(`🔗 Link Engelleme ${action === 'aç' ? 'Açıldı' : 'Kapatıldı'}!`)
            .setDescription(`\`\`\`diff\n${action === 'aç' ? '+ Link engelleme sistemi aktif hale getirildi!' : '- Link engelleme sistemi pasif hale getirildi!'}\n\`\`\``)
            .addFields(
                { name: '🎯 Durum', value: action === 'aç' ? '🟢 **Aktif**' : '🔴 **Pasif**', inline: true },
                { name: '⚠️ Uyarı Sistemi', value: '3 uyarı = Otomatik Mute', inline: true },
                { name: '⏰ Mute Süresi', value: `${Math.floor((serverData[guildId].linkMuteDuration || 600) / 60)} dakika`, inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true }
            )
            .setThumbnail(action === 'aç' ? 'https://cdn.discordapp.com/emojis/1074004608665653338.gif' : 'https://cdn.discordapp.com/emojis/1074004662932082760.png')
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Anti-Link Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Anti-advert komutu
    if (command === 'anti-advert') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const action = args[0];
        if (!action || !['aç', 'kapa'].includes(action)) {
            return message.reply('❌ Kullanım: `.anti-advert aç` veya `.anti-advert kapa`');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        serverData[guildId].antiAdvert = action === 'aç';
        saveData();

        const embed = new EmbedBuilder()
            .setColor(action === 'aç' ? '#2ecc71' : '#e74c3c')
            .setTitle(`📢 Reklam Engelleme ${action === 'aç' ? 'Açıldı' : 'Kapatıldı'}!`)
            .setDescription(`\`\`\`diff\n${action === 'aç' ? '+ Reklam engelleme sistemi aktif hale getirildi!' : '- Reklam engelleme sistemi pasif hale getirildi!'}\n\`\`\``)
            .addFields(
                { name: '🎯 Durum', value: action === 'aç' ? '🟢 **Aktif**' : '🔴 **Pasif**', inline: true },
                { name: '⚠️ Uyarı Sistemi', value: '3 uyarı = Otomatik Mute', inline: true },
                { name: '⏰ Mute Süresi', value: `${Math.floor((serverData[guildId].advertMuteDuration || 600) / 60)} dakika`, inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true }
            )
            .setThumbnail(action === 'aç' ? 'https://cdn.discordapp.com/emojis/1074004608665653338.gif' : 'https://cdn.discordapp.com/emojis/1074004662932082760.png')
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Anti-Advert Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Anti-everyone komutu
    if (command === 'anti-everyone') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const action = args[0];
        if (!action || !['aç', 'kapa'].includes(action)) {
            return message.reply('❌ Kullanım: `.anti-everyone aç` veya `.anti-everyone kapa`');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        serverData[guildId].antiEveryone = action === 'aç';
        saveData();

        const embed = new EmbedBuilder()
            .setColor(action === 'aç' ? '#2ecc71' : '#e74c3c')
            .setTitle(`👥 Everyone Engelleme ${action === 'aç' ? 'Açıldı' : 'Kapatıldı'}!`)
            .setDescription(`\`\`\`diff\n${action === 'aç' ? '+ Everyone/Here engelleme sistemi aktif hale getirildi!' : '- Everyone/Here engelleme sistemi pasif hale getirildi!'}\n\`\`\``)
            .addFields(
                { name: '🎯 Durum', value: action === 'aç' ? '🟢 **Aktif**' : '🔴 **Pasif**', inline: true },
                { name: '⚠️ Uyarı Sistemi', value: '3 uyarı = Otomatik Mute', inline: true },
                { name: '⏰ Mute Süresi', value: `${Math.floor((serverData[guildId].everyoneMuteDuration || 600) / 60)} dakika`, inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true }
            )
            .setThumbnail(action === 'aç' ? 'https://cdn.discordapp.com/emojis/1074004608665653338.gif' : 'https://cdn.discordapp.com/emojis/1074004662932082760.png')
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Anti-Everyone Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Anti-swear komutu
    if (command === 'anti-swear') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const action = args[0];
        if (!action || !['aç', 'kapa'].includes(action)) {
            return message.reply('❌ Kullanım: `.anti-swear aç` veya `.anti-swear kapa`');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        serverData[guildId].antiSwear = action === 'aç';
        saveData();

        const embed = new EmbedBuilder()
            .setColor(action === 'aç' ? '#2ecc71' : '#e74c3c')
            .setTitle(`🤬 Küfür Engelleme ${action === 'aç' ? 'Açıldı' : 'Kapatıldı'}!`)
            .setDescription(`\`\`\`diff\n${action === 'aç' ? '+ Küfür engelleme sistemi aktif hale getirildi!' : '- Küfür engelleme sistemi pasif hale getirildi!'}\n\`\`\``)
            .addFields(
                { name: '🎯 Durum', value: action === 'aç' ? '🟢 **Aktif**' : '🔴 **Pasif**', inline: true },
                { name: '⚠️ Uyarı Sistemi', value: '3 uyarı = Otomatik Mute', inline: true },
                { name: '⏰ Mute Süresi', value: `${Math.floor((serverData[guildId].swearMuteDuration || 600) / 60)} dakika`, inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true }
            )
            .setThumbnail(action === 'aç' ? 'https://cdn.discordapp.com/emojis/1074004608665653338.gif' : 'https://cdn.discordapp.com/emojis/1074004662932082760.png')
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Anti-Swear Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Mute süre ayarlama komutu
    if (command === 'mute-süre') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const type = args[0]; // link, advert, everyone, swear
        const duration = parseInt(args[1]); // saniye cinsinden

        if (!type || !['link', 'advert', 'everyone', 'swear'].includes(type) || !duration || duration < 10) {
            return message.reply('❌ Kullanım: `.mute-süre link/advert/everyone/swear <saniye>` (Min: 10 saniye)');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        if (type === 'link') {
            serverData[guildId].linkMuteDuration = duration;
        } else if (type === 'advert') {
            serverData[guildId].advertMuteDuration = duration;
        } else if (type === 'everyone') {
            serverData[guildId].everyoneMuteDuration = duration;
        } else if (type === 'swear') {
            serverData[guildId].swearMuteDuration = duration;
        }

        saveData();

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('⏰ Mute Süresi Güncellendi!')
            .setDescription(`\`\`\`diff\n+ ${type === 'link' ? 'Link' : type === 'advert' ? 'Reklam' : type === 'everyone' ? 'Everyone' : 'Küfür'} mute süresi başarıyla güncellendi!\n\`\`\``)
            .addFields(
                { name: '📝 Tür', value: type === 'link' ? 'Link Engelleme' : type === 'advert' ? 'Reklam Engelleme' : type === 'everyone' ? 'Everyone Engelleme' : 'Küfür Engelleme', inline: true },
                { name: '⏰ Yeni Süre', value: `${Math.floor(duration / 60)} dakika ${duration % 60} saniye`, inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Mute Süre Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Uyarı temizleme komutu
    if (command === 'uyarı-temizle') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('❌ Kullanım: `.uyarı-temizle @kullanıcı`');
        }

        if (userWarnings[guildId] && userWarnings[guildId][user.id]) {
            userWarnings[guildId][user.id] = { link: 0, advert: 0, everyone: 0, swear: 0 };
        }

        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🧹 Uyarılar Temizlendi!')
            .setDescription(`**${user.tag}** kullanıcısının tüm uyarıları temizlendi!`)
            .addFields(
                { name: '👤 Kullanıcı', value: `<@${user.id}>`, inline: true },
                { name: '👮 Temizleyen', value: `<@${message.author.id}>`, inline: true },
                { name: '🔄 Durum', value: 'Tüm uyarılar sıfırlandı', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: serverData[guildId]?.footerText || 'Made and Developed by Xedevil', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Taglı alım komutu
    if (command === 'taglı-alım') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu sadece yetkililer kullanabilir!');
        }

        const action = args[0];
        if (!action || !['aç', 'kapa'].includes(action)) {
            return message.reply('❌ Kullanım: `.taglı-alım aç` veya `.taglı-alım kapa`');
        }

        if (!serverData[guildId]) {
            serverData[guildId] = {};
        }

        serverData[guildId].taggedRecruitment = action === 'aç';
        saveData();

        const embed = new EmbedBuilder()
            .setColor(action === 'aç' ? '#2ecc71' : '#e74c3c')
            .setTitle(`🏷️ Taglı Alım ${action === 'aç' ? 'Açıldı' : 'Kapatıldı'}!`)
            .setDescription(`\`\`\`diff\n${action === 'aç' ? '+ Taglı alım sistemi aktif hale getirildi!' : '- Taglı alım sistemi pasif hale getirildi!'}\n\`\`\``)
            .addFields(
                { name: '🎯 Durum', value: action === 'aç' ? '🟢 **Aktif**' : '🔴 **Pasif**', inline: true },
                { name: '👮 Güncelleyen', value: `<@${message.author.id}>`, inline: true },
                { name: '⏰ Güncelleme Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                { name: '💡 Bilgi', value: action === 'aç' ? 'Taglı kullanıcılar artık özel muamele görecek.' : 'Taglı alım sistemi devre dışı bırakıldı.', inline: false }
            )
            .setThumbnail(action === 'aç' ? 'https://cdn.discordapp.com/emojis/1074004608665653338.gif' : 'https://cdn.discordapp.com/emojis/1074004662932082760.png')
            .setTimestamp()
            .setFooter({ text: serverData[guildId].footerText || 'Made and Developed by Xedevil • Taglı Alım Sistemi', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Help komutu
    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('📚 Gelişmiş Bot Komut Merkezi')
            .setDescription('```yaml\n🤖 Xedevil Bot - Komut Rehberi\n💡 Prefix: .\n🔰 Gerekli İzin: Administrator\n```')
            .addFields(
                { 
                    name: '⚙️ Sistem Komutları', 
                    value: '```fix\n.setup\n```**→** Sunucu otomatik kurulumu\n```fix\n.restart\n```**→** Bot yeniden başlatma\n```fix\n.tag <tag>\n```**→** Sunucu tagı ayarlama', 
                    inline: false 
                },
                { 
                    name: '👥 Kayıt Komutları', 
                    value: '```fix\n.e @kullanıcı <isim>\n```**→** Erkek kayıt işlemi\n```fix\n.k @kullanıcı <isim>\n```**→** Kadın kayıt işlemi\n```fix\n.unregistered @kullanıcı\n```**→** Kayıt silme işlemi', 
                    inline: false 
                },
                { 
                    name: '🛠️ Yönetim Komutları', 
                    value: '```fix\n.name @kullanıcı <isim>\n```**→** İsim değiştirme\n```fix\n.taglı-alım aç/kapa\n```**→** Taglı alım sistemi', 
                    inline: false 
                },
                { 
                    name: '🛡️ Moderasyon Komutları', 
                    value: '```fix\n.anti-link aç/kapa\n```**→** Link engelleme sistemi\n```fix\n.anti-advert aç/kapa\n```**→** Reklam engelleme sistemi\n```fix\n.anti-everyone aç/kapa\n```**→** Everyone engelleme sistemi\n```fix\n.anti-swear aç/kapa\n```**→** Küfür engelleme sistemi', 
                    inline: false 
                },
                { 
                    name: '⚙️ Moderasyon Ayarları', 
                    value: '```fix\n.mute-süre link/advert/everyone/swear <saniye>\n```**→** Mute süre ayarlama\n```fix\n.uyarı-temizle @kullanıcı\n```**→** Kullanıcı uyarılarını temizle', 
                    inline: false 
                },
                { 
                    name: '📊 Bilgi Komutları', 
                    value: '```fix\n.info\n```**→** Bot ve sistem bilgileri\n```fix\n.help\n```**→** Bu yardım menüsü', 
                    inline: false 
                },
                { 
                    name: '💎 Özellikler', 
                    value: '• Otomatik rol verme\n• Tag algılama sistemi\n• Gelişmiş log sistemi\n• Çoklu dil desteği\n• Modern tasarım', 
                    inline: false 
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setImage('https://cdn.discordapp.com/attachments/1074004447292436480/1074004731109253160/banner.gif')
            .setTimestamp()
            .setFooter({ text: 'Made and Developed by Xedevil • Premium Discord Bot', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Info komutu
    if (command === 'info') {
        const uptimeSeconds = Math.floor((Date.now() - client.readyTimestamp) / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        
        let pingColor = '#2ecc71';
        if (client.ws.ping > 100) pingColor = '#f39c12';
        if (client.ws.ping > 200) pingColor = '#e74c3c';

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('🤖 Xedevil Bot - Sistem Bilgileri')
            .setDescription('```yaml\n💎 Premium Discord Sunucu Yönetim Botu\n🚀 Gelişmiş Özellikler & Modern Tasarım\n```')
            .addFields(
                { 
                    name: '👨‍💻 Geliştirici Bilgileri', 
                    value: '```\n👤 Xedevil\n🏆 Premium Developer\n🌟 5+ Yıl Deneyim\n```', 
                    inline: true 
                },
                { 
                    name: '📊 İstatistikler', 
                    value: `\`\`\`\n🏠 ${client.guilds.cache.size} Sunucu\n👥 ${client.users.cache.size.toLocaleString()} Kullanıcı\n📈 99.9% Uptime\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '⚡ Performans', 
                    value: `\`\`\`\n🏓 ${client.ws.ping}ms Ping\n💾 Node.js v18\n🔧 Discord.js v14\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '⏰ Çalışma Süresi', 
                    value: `\`\`\`\n📅 ${days} Gün\n🕐 ${hours} Saat\n⏱️ ${minutes} Dakika\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '🏷️ Sunucu Ayarları', 
                    value: `\`\`\`\n🏷️ Tag: ${config.serverTag}\n✅ Aktif Sistem\n🔰 v2.0 Sürüm\n\`\`\``, 
                    inline: true 
                },
                { 
                    name: '💎 Premium Özellikler', 
                    value: '```\n🎯 Otomatik Kayıt\n🏷️ Tag Algılama\n📊 Gelişmiş Loglar\n🌍 Çoklu Dil\n```', 
                    inline: true 
                },
                { 
                    name: '📞 Destek & İletişim', 
                    value: '**[Discord Sunucusu](https://discord.gg/xedevil)**\n**[GitHub Profili](https://github.com/xedevil)**\n**[Website](https://xedevil.dev)**', 
                    inline: false 
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setImage('https://cdn.discordapp.com/attachments/1074004447292436480/1074004731109253160/banner.gif')
            .setTimestamp()
            .setFooter({ text: 'Made and Developed by Xedevil • Premium Discord Bot v2.0', iconURL: message.guild.iconURL() });

        message.reply({ embeds: [embed] });
    }

    // Restart komutu
    if (command === 'restart') {
        if (!isAdmin(message.member)) {
            return message.reply('❌ Bu komutu kullanmak için Administrator iznine sahip olmalısınız!');
        }

        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('🔄 Sistem Yeniden Başlatılıyor...')
            .setDescription('```yaml\n🔄 Bot yeniden başlatılıyor...\n⏳ Lütfen 10-15 saniye bekleyiniz...\n✅ Sistem otomatik olarak tekrar aktif olacak\n```')
            .addFields(
                { name: '⚡ İşlem', value: '```\nSistem Restart\n```', inline: true },
                { name: '⏱️ Tahmini Süre', value: '```\n~15 saniye\n```', inline: true },
                { name: '👮 Başlatan', value: `<@${message.author.id}>`, inline: true }
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/1074004691079667752.png')
            .setTimestamp()
            .setFooter({ text: 'Made and Developed by Xedevil • Restart Sistemi', iconURL: message.guild.iconURL() });

        await message.reply({ embeds: [embed] });
        
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }
});

// Button etkileşimleri
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const guildId = interaction.guild.id;
    const data = serverData[guildId];

    if (interaction.customId === 'confirm_rules') {
        try {
            const member = interaction.member;
            const unregisteredRole = findRole(interaction.guild, config.roles.kayitsiz) || findRole(interaction.guild, 'Kayıtsız');

            // Kullanıcının diğer kanalları görmesini sağla
            if (unregisteredRole && member.roles.cache.has(unregisteredRole.id)) {
                // Kayıtsız rolünü çıkar ama henüz üye rolü verme, sadece görüntüleme izni ver
                const channels = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
                
                for (const [channelId, channel] of channels) {
                    if (!['register', 'register-info'].includes(channel.name)) {
                        try {
                            await channel.permissionOverwrites.edit(member.user.id, {
                                ViewChannel: true
                            });
                        } catch (error) {
                            console.log(`Kanal izni ayarlanamadı: ${channel.name}`, error);
                        }
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Kurallar Onaylandı!')
                    .setDescription('Kuralları onayladığınız için teşekkürler! Artık sunucunun diğer kanallarını görebilirsiniz.')
                    .addFields(
                        { name: '📝 Kayıt Olmak İçin', value: 'Bir yetkili ile iletişime geçin veya #register kanalını kullanın.', inline: false }
                    )
                    .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil' });

                await interaction.reply({ embeds: [embed], ephemeral: true });

                // Tag kontrolü yap
                const serverTag = data?.tag || config.serverTag;
                if (serverTag && interaction.user.username.includes(serverTag)) {
                    const tagNotification = new EmbedBuilder()
                        .setColor('#ffd700')
                        .setTitle('🏷️ Tag Tespit Edildi!')
                        .setDescription(`Kullanıcı adınızda sunucu tagı tespit edildi! (${serverTag})\nOtomatik kayıt için bir yetkili ile iletişime geçin.`)
                        .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil' });

                    await interaction.followUp({ embeds: [tagNotification], ephemeral: true });

                    // Tag log kanalına bildir
                    const tagLogChannel = findChannel(interaction.guild, config.channels.tagLog) || findChannel(interaction.guild, 'tag-log');
                    if (tagLogChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#ffd700')
                            .setTitle('🏷️ Taglı Kullanıcı Tespit Edildi!')
                            .setDescription(`**${interaction.user.tag}** taglı kullanıcı kuralları onayladı!`)
                            .addFields(
                                { name: '👤 Kullanıcı', value: `<@${interaction.user.id}>`, inline: true },
                                { name: '🏷️ Tag', value: serverTag, inline: true },
                                { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: data?.footerText || 'Made and Developed by Xedevil' });

                        await tagLogChannel.send({ embeds: [logEmbed] });
                    }
                }
            }

        } catch (error) {
            console.log('Button etkileşim hatası:', error);
            await interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
        }
    }
});

// Hata yakalama
client.on('error', error => {
    console.log('Bot hatası:', error);
});

process.on('unhandledRejection', error => {
    console.log('Yakalanmamış hata:', error);
});

// Token kontrolü
if (!config.token) {
    console.log('❌ DISCORD_BOT_TOKEN .env dosyasında bulunamadı!');
    console.log('Lütfen .env dosyasına bot tokeninizi ekleyin.');
    process.exit(1);
}

// Botu başlat
client.login(config.token).catch(error => {
    console.log('Bot giriş hatası:', error);
    console.log('Lütfen bot tokeninizi kontrol edin!');
});
