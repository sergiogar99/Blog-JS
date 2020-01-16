import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';
import { PubSub } from "graphql-yoga";
import "babel-polyfill";


const Query = {

    getAutor:async (parent, args, ctx, info) => {  

      const { name } = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      const user = await collection.findOne({name:name});

      if(user){ return user 
        
        
      }else{

       throw new Error( name + ' no encontrado');

      }
    
    },

    getEntradas:async (parent, args, ctx, info) => { 
      
      const { name } = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      const user = await collection.findOne({name:name});

      if(user){

        
        const collection = db.collection("entradas");

        const result = await collection.find({"idAutor": user._id}).toArray(); 

        return result;

      }else{

        throw new Error( name + ' no encontrado');

      }
    
    },      

}




export {Query as default}