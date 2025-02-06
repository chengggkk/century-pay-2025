import { Client, GatewayIntentBits, Message } from 'discord.js';
import * as dotenv from 'dotenv';
import { Reply } from './src/app/api/interactions/reply';

dotenv.config();

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
     ],
  });
  
  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });

  client.on('messageCreate', async (message: Message) => {
    // Prevent the bot from replying to itself
    if (message.author.bot) return;
  
    // Check if the message is a reply
    if (message.reference) {
      try {
        // Fetch the original message being replied to
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId!);
  
        // Check if the original message was sent by the bot
        if (referencedMessage.author.id === client.user?.id) {
          console.log('Original message:', message.content);
        
          const replyResponse = await Reply(message.channel.id, message.author.id, message.content);
        
          // Check if replyResponse is defined before accessing .text()
          if (replyResponse) {
            
              await message.reply(replyResponse);
            
          } else {
            console.error('Reply function returned undefined.');
          }
        }
      } catch (error) {
        console.error('Failed to fetch the referenced message:', error);
      }
    }
  });
    client.login(process.env.DISCORD_TOKEN);

    