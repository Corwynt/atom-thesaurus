'use babel';
/* jshint esversion:6*/
import config from "./config-schema.json";
import { CompositeDisposable } from 'atom';
import ThesaurusView from './popup-view';
import request from "request-promise";

Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
};

let Thesaurus={
  config,
  subscriptions: null,
  thesaurus:null,
  activate: function(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'thesaurus:find': ()=>this.run()
    }));
    this.subscriptions.add(
      atom.config.observe('thesaurus', value => {
        this.applySettings();
      })
    );
  },
  applySettings(){
    let settings=atom.config.get("thesaurus");
    console.log("APPLY SETTINGS");
    if(settings.language=="german"){

      this.thesaurus=(word)=> new Promise(function(resolve, reject) {
        request({
          method: "GET",
          url: `https://www.openthesaurus.de/synonyme/search?q=${word}&format=application/json`,
          json: {}
        }).then((data) => {
          resolve(data.synsets.map((s)=>s.terms.map(t=>t.term)).reduce((out,terms)=>out.concat(terms),[]));
        },function(error){
          switch(error.statusCode){
            default:
              console.log(error);
              reject("Error while getting results");
          }
        });
      });
    }else{
      if(/^[a-f0-9]{32}$/.test(settings.apiKey)){
        this.thesaurus=(word)=> new Promise(function(resolve, reject) {
          request({
            method: "GET",
            url: `http://words.bighugelabs.com/api/2/${settings.apiKey}/${word}/json`,
            json: {}
          }).then((data) => {
            let result=[];
            for(let type in data){
              if(data[type].hasOwnProperty("syn")){
                result=result.concat(data[type].syn);
              }
            }
            resolve(result);
          },function(error){
            switch(error.statusCode){
              case 500:
                reject("Invalid API Key");
                break;
              default:
                console.log(error);
                reject("Error while getting results");
            }
          });
        });
      }else{
        this.thesaurus=()=>Promise.reject("No or Invalid API key specified");
      }
    }
  },
  deactivate: function() {
    this.subscriptions.dispose();
  },
  run: function() {
    var editor, mark, pattern, range;
    editor = atom.workspace.getActivePaneItem();
    if(editor===null)return;
    pattern =  editor.getSelectedText();
    if (pattern === "") {
      pattern = editor.getWordUnderCursor();
    }
    if (!pattern) {
      return;
    }
    range = editor.getLastCursor().getCurrentWordBufferRange();
    pattern=pattern.replace(/[^A-Za-z0-9 ]/g,"");
    mark = editor.getBuffer().markRange(range, {
      invalidate: 'touch',
      replicate: 'false',
      persistent: false,
      maintainHistory: false
    });
    this.thesaurus(pattern).then((data)=>this.synonymsView = new ThesaurusView(editor, data.getUnique(), mark),function(err){
      atom.notifications.addError(err);
    });
  },
};
export default Thesaurus;
