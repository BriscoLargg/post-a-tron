const request = require('request-promise-native');
const Discord = require('discord.js');
const Url = require('urijs');
var fs = require('fs');

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var cardList = require("../data/cardList.txt");

const manamoji = require('./middleware/manamoji');
const utm = require('./middleware/utm');


class TextResponse {
  constructor(client, cardName) {
    this.client = client;
    this.cardName = cardName;
  }

  makeQuerystring() {
    return {
      fuzzy: this.cardName,
      format: 'text'
    };
  }

  makeUrl() {
    return Url(this.url).query(this.makeQuerystring()).toString();
  }

  makeRequest() {
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        resolveWithFullResponse: true,
        uri: this.makeUrl()
      }).then(response => {
        resolve(response);
      }).catch(err => {
        resolve(err.response);
      });
    });
  }

  makeEmbed(response) {
    //let parts = response.body.split('\n');
    //const embedTitle = parts.shift();
    console.log(response);
    return {
      title: response.name,
      description: response.text,
      url: response.url,
      thumbnail: {
        url: this.imageurl + response.imagesrc
      }
    };
  }

  lookupCard() {
    return new Promise((resolve, reject) => {
      try{
        //var cardList = require("../data/cardList.txt");
        var cardListEval = eval(cardList);
        //console.log(cardListEval);
        var i, len = cardListEval.length, stop = 1, out;
        for (i = 0; i < len; i++) {
            var current = cardListEval[i];
            if (current.title.toLowerCase() === this.cardName.toLowerCase()) {
                console.log("here");
                out = cardListEval[i];
                stop = 0;
            }
        }
        if(stop === 0){
          resolve(out);
        }else{
          reject("Nothing Found");
        }
      }catch(err) {
        reject(err);
      }
    });
  }

  embed() {
    return new Promise((resolve, reject) => {
      this.lookupCard().then(response => {
        let embed = this.makeEmbed(response);
        this.middleware.length > 0 && this.middleware.forEach(mw => {
          embed = mw(this.client, embed);
        });
        resolve(embed);
      });
    });
  }
}

TextResponse.prototype.middleware = [ manamoji, utm ];
TextResponse.prototype.url = 'http://dtdb/api/card/';
TextResponse.prototype.imageurl = 'http://dtdb.co';


class ImageResponse extends TextResponse {
  makeEmbed(response) {
    //let parts = response.body.split('\n');
    return {
      title: response.name,
      url: response.url,
      image: {
        url: this.imageurl + response.imagesrc
      }
    };
  }
}


module.exports = { TextResponse, ImageResponse };
