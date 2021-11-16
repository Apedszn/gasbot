const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const nodeHtmlToImage = require('node-html-to-image')
var axios = require("axios").default;

/// USER INPUTS HERE ///
const discAuthKey = "DiscBotAuthKey" //enter your Discord Bot Authentication Key here
const gasID = "gasChannelID" //enter the Channel ID you would like gas messages sent to
const imgID = "imageChannelID" //enter the secret Channel ID where you would like the gas images sent to
const bnAPIKey = "BlockNativeAPIKey" //enter your Block Native API key here
const alertTimer = 30; //Alert message time out timer in minutes
const pollBNAPI = 86.4; //Seconds between polls to pull gas data from BlockNative API (this is calculated based on the free BlockNative plan)
const gasAlertLevel = 80; //gas in GWEI to alert if it drops below this value
/// USER INPUTS END ///

//Initial global variables
var alertMessage = null;
var gasMessage = null;
var gasChannel = null;
var imgChannel = null;
var alertLock = false;

//New Message embed object for gas message
let e = new MessageEmbed();
//New message embed object for alert message
let ea = new MessageEmbed();

const axiosoptions = {
    method: 'GET',
    url : `https://api.blocknative.com/gasprices/blockprices`,
    headers: {
        Authorization: bnAPIKey
    }
};

//Create new Discord Bot Client
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

client.on("ready", async () => {
    //Create Discord Channel object for gas channel
    gasChannel = await client.channels.fetch(gasID);
    //Create Discord Channel object for secret image channel
    imgChannel = await client.channels.fetch(imgID);
    console.log("I am ready!");
    start()
});

//Login to Discord Bot Client using authentication key
client.login(discAuthKey);

//Delay function to pause script for N milliseconds
async function delay(ms, state = null){
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(state), ms);
    });
}

//Start loop to constantly pull gas data from Block Native every 
async function start(){
    do{
        await axios.request(axiosoptions).then(async function (response) {
            const resp = response.data;
            queue(sendToDiscord(resp))
        }).catch(function (error) {
            console.error(error);
        });
        await delay(pollBNAPI * 1000)
    }while(true)
}

//Function queue to force functions to execute one after the other sequentially
var q_ = Promise.resolve();
async function queue(fn) {
    q_ = q_.then(await fn);
    return q_;
}

//Function to send gas message to Discord
async function sendToDiscord(r){
    const base = r.blockPrices[0]
    const currentGas = parseFloat(base.baseFeePerGas).toFixed(2)
    const d = new Date();
    const dt = d.toLocaleString('en-US',{dateStyle: 'short',timeStyle:'long',timeZone: 'America/Los_Angeles'});
    //create Gas image from html code
    const tableImg = await htmlToImage(r)
    const file = new MessageAttachment(tableImg,`gas.jpeg`)
    const msg = await imgChannel.send({ files: [file] })
    const url = msg.attachments.first()?.url ?? '';
    e
        .setTitle(`Current Gas: ${currentGas}`)
        .setURL('https://www.blocknative.com/gas-estimator')
        .setDescription(`Updated at ${dt}`)
        .setImage(url)
        .setFooter('Powered by Blocknative')
    await msg.delete()
    try{
        await gasMessage.edit({
            username: `Gas Ser`,
            embeds: [e],
        })
    }catch{
        console.log("No Msg ID"); 
        if (gasMessage?.id !== undefined && !alertLock){
            await gasMessage.delete();
            gasMessage = {}
        }
            gasMessage = await gasChannel.send({
            username: `Gas Ser`,
            embeds: [e],
        });
        
    }
    if(currentGas <= gasAlertLevel && !alertLock){
      ea
        .setTitle(`Current Gas: ${currentGas}`)
        .setURL('https://www.blocknative.com/gas-estimator')
        .setDescription(`[❗ALERT❗ Gas has dropped below ${gasAlertLevel} gwei. This message will self-destruct in ${alertTimer} minutes](https://www.blocknative.com/gas-estimator)
Sent at ${dt}`)
      if(alertMessage?.id !== undefined){
        console.log("deleting",alertMessage.id)
        await alertMessage.delete();
      }
        alertMessage = await gasMessage.send({
            username: `ALERT SER`,
            embeds: [ea],
        });
        alertLocker()
    }
}

//function to lock the gas alert from being deleted for alertTimer minutes
async function alertLocker(){
    alertLock = true;
    await delay(alertTimer * 60 * 1000)
    alertLock = false;
    //await webhookClient.deleteMessage(m.id)
}

//create image from HTML code
async function htmlToImage(r){
    const base = r.blockPrices[0]
    const estimated = base.estimatedPrices
    const maxPFee0 = parseFloat(estimated[0].maxPriorityFeePerGas).toFixed(2)
    const maxPFee1 = parseFloat(estimated[1].maxPriorityFeePerGas).toFixed(2)
    const maxPFee2 = parseFloat(estimated[2].maxPriorityFeePerGas).toFixed(2)
    const maxPFee3 = parseFloat(estimated[3].maxPriorityFeePerGas).toFixed(2)
    const maxPFee4 = parseFloat(estimated[4].maxPriorityFeePerGas).toFixed(2)
    const maxFee0 = parseFloat(estimated[0].maxFeePerGas).toFixed(0)
    const maxFee1 = parseFloat(estimated[1].maxFeePerGas).toFixed(0)
    const maxFee2 = parseFloat(estimated[2].maxFeePerGas).toFixed(0)
    const maxFee3 = parseFloat(estimated[3].maxFeePerGas).toFixed(0)
    const maxFee4 = parseFloat(estimated[4].maxFeePerGas).toFixed(0)
    const prob0 = estimated[0].confidence + "%"
    const prob1 = estimated[1].confidence + "%"
    const prob2 = estimated[2].confidence + "%"
    const prob3 = estimated[3].confidence + "%"
    const prob4 = estimated[4].confidence + "%"
    const _htmlTemplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <style>
      body {
        font-family: "Poppins", Arial, Helvetica, sans-serif;
        background: rgb(22, 22, 22);
        color: #fff;
        max-width: 300px;
      }

      .app {
        max-width: 300px;
        font-size:14px;
        <!-- padding: 20px; -->
        display: flex;
        flex-direction: row;
        <!-- border-top: 3px solid rgb(16, 180, 209); -->
        background: rgb(31, 31, 31);
        align-items: center;
      }

      img {
        width: 50px;
        height: 50px;
        margin-right: 20px;
        border-radius: 50%;
        border: 1px solid #fff;
        padding: 5px;
      }
      table, th, td {
        text-align: center;
      }
      td{
          color: black;
      }
      table {
        width:100%;
        height: 100px;
      }
      .green {
        background-color: #62B76D;
      }
      .lightgreen {
        background-color: #85E97A;
      }
      .lime{
        background-color: #D3ECAD;
      }
      .yellow{
        background-color: #D8F22F;
      }
      .orange{
        background-color: #F2D82F;
      }
      .black{
        background-color: black;
      }

    </style>
  </head>
  <body>
    <div class="app">
    <table>
    <colgroup>
    <col class="black" />
    <col class="green" />
    <col class="lightgreen" />
    <col class="lime" />
    <col class="yellow" />
    <col class="orange" />
    </colgroup>
    <tr>
    <th>Prob</th>
    <td>${prob0}</td>
    <td>${prob1}</td>
    <td>${prob2}</td>
    <td>${prob3}</td>
    <td>${prob4}</td>
    </tr>
    <tr>
      <th>Priority</th>
      <td>${maxPFee0}</td>
      <td>${maxPFee1}</td>
      <td>${maxPFee2}</td>
      <td>${maxPFee3}</td>
      <td>${maxPFee4}</td>
    </tr>
    <tr>
      <th>Gas</th>
      <td>${maxFee0}</td>
      <td>${maxFee1}</td>
      <td>${maxFee2}</td>
      <td>${maxFee3}</td>
      <td>${maxFee4}</td>
    </tr>
  </table>
    </div>
  </body>
</html>
`

    const images = await nodeHtmlToImage({
        html: _htmlTemplate,
        quality: 100,
        type: 'jpeg',
        puppeteerArgs: {
          args: ['--no-sandbox'],
        },
        encoding: 'buffer',
    })
    return images;
}
