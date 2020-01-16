import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';
import { PubSub } from "graphql-yoga";
import "babel-polyfill";


const Autores = {

    entradas:async (parent, args, ctx, info)=>{

      const name= parent.name;
      
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      const exist = await collection.findOne({name:name});


      if(exist){

        const collection = db.collection("entradas");

        const result = await collection.find({"idAutor": exist._id}).toArray(); 

        if(result) return result;
      }
    },


}

export {Autores as default}