const { Client, Intents, MessageEmbed, MessageAttachment } = require('discord.js');
const nodeHtmlToImage = require('node-html-to-image')
const gasID = "886418519078613042"
const imgID = "908576507029499934"
var axios = require("axios").default;
const bnAPIKey = "f2a7f0d4-0e8c-414a-b259-30345b2d932c"
var alertMessage = null;
var gasMessage = null;
var alertLock = false;
var alertTimer = 30;
let e = new MessageEmbed();
let ea = new MessageEmbed();
var prevMsg = null;
var msg = null;
const axiosoptions = {
    method: 'GET',
    url : `https://api.blocknative.com/gasprices/blockprices`,
    headers: {
        Authorization: bnAPIKey
    }
};
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

var gasChannel = null;
var imgChannel = null;
client.on("ready", async () => {
    gasChannel = await client.channels.fetch(gasID);
    imgChannel = await client.channels.fetch(imgID);
    console.log("I am ready!");
    start()
});

client.login("OTA1NjkyNjE2MjkxNjgwMjg3.YYNx-g.XTI2tY0Di-NjtIISFl0pw4ZUkEY");

async function delay(ms, state = null){
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(state), ms);
    });
}

async function start(){
    do{
        await axios.request(axiosoptions).then(async function (response) {
            const resp = response.data;
            queue(sendToDiscord(resp))
        }).catch(function (error) {
            console.error(error);
        });
        await delay(86.4 * 1000)
    }while(true)
}
async function startTimer(){

}
var q_ = Promise.resolve();
async function queue(fn) {
    q_ = q_.then(await fn);
    return q_;
}

async function sendToDiscord(r){
    prevMsg = msg;
    const base = r.blockPrices[0]
    const currentGas = parseFloat(base.baseFeePerGas).toFixed(2)
    const d = new Date();
    const dt = d.toLocaleString('en-US',{dateStyle: 'short',timeStyle:'long',timeZone: 'America/Los_Angeles'});
    var url = ''
    try{
        const tableImg = await htmlToImage(r)
        const file = new MessageAttachment(tableImg,`gas.jpeg`)
        msg = await imgChannel.send({ files: [file] })
        url = msg.attachments.first()?.url ?? '';
    }catch{
        console.log("Image Error")
    }
    e
        .setTitle(`Current Gas: ${currentGas}`)
        .setURL('https://www.blocknative.com/gas-estimator')
        .setDescription(`Updated at ${dt}`)
        .setImage(url)
        .setFooter('Powered by Blocknative')
    if(prevMsg !== null){
        await prevMsg.delete()
    }
    try{
        await gasMessage.edit({
            username: `Gas Ser`,
            embeds: [e],
        })
    }catch{
        console.log("No Msg ID");
        
        if (gasMessage?.id !== undefined){
          await gasMessage.delete();
      }
          gasMessage = await gasChannel.send({
            username: `Gas Ser`,
            embeds: [e],
        });
        
    }
    if(alertMessage?.id !== undefined && !alertLock){
        console.log("deleting",alertMessage.id)
        await alertMessage.delete();
        alertMessage = {}
    }
    if(currentGas <= 80 && !alertLock){
      ea
        .setTitle(`Current Gas: ${currentGas}`)
        .setURL('https://www.blocknative.com/gas-estimator')
        .setDescription(`[❗ALERT❗ Gas has dropped below 80 gwei. This message will self-destruct in ${alertTimer} minutes](https://www.blocknative.com/gas-estimator)
Sent at ${dt}`)
        alertMessage = await gasChannel.send({
            username: `ALERT SER`,
            embeds: [ea],
        });
        alertLocker()
    }
}
async function alertLocker(){
    alertLock = true;
    await delay(alertTimer * 60 * 1000)
    alertLock = false;
    //await webhookClient.deleteMessage(m.id)
}
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
      product: "chrome",
      executablePath: "/usr/lib/chromium-browser/chromium-browser",
      args: ['--no-sandbox'],
    },
    encoding: 'buffer',
  })
return images;
}
