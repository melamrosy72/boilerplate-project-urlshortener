require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const mongoose=require('mongoose')


// Basic Configuration
const port = process.env.PORT || 3000;
require('dotenv').config()

console.log(process.env.DB_URI);
try {
    mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (err) {
    console.log(err)
}

// Model
const schema = new mongoose.Schema(
  {
      original: { type: String, required: true },
      short: { type: Number, required: true }
  }
);
const Url = mongoose.model('Url', schema);


app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get("/api/shorturl/:input",async (req, res) => {
  const input = parseInt(req.params.input);
  const shortcut=await Url.findOne({short:input})
  if(!shortcut) return res.json({error: 'invalid url'})
  res.status(301).redirect(shortcut.original)
})


app.post("/api/shorturl", async (req, res) => {
  try {
    const bodyUrl=req.body.url
    const urlRegEXP= new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/)
    if(!bodyUrl.match(urlRegEXP)) return res.status(400).json({error: "Invalid URL"})

    const exist=await Url.findOne({original:bodyUrl})
    if(exist){
      return res.status(200).json({message:'This URL Shortcut is already exist' , original_url: exist.original , short_url : exist.short})
    }
    const count=await Url.countDocuments({})
    console.log(count);
    const newShort=new Url({original:bodyUrl , short :count+1 })
    await newShort.save()
    res.status(200).json({original_url: newShort.original , short_url: newShort.short}) 
  } catch (err) {
    res.status(500).json({err,message:err.message});
    console.log(err);
  }
}

)

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
