import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';
import { PubSub } from "graphql-yoga";
import "babel-polyfill";

const Entradas = {

    autor:async (parent, args, ctx, info)=>{

     
      const id= parent.idAutor;
      
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");
      const result = await collection.findOne({ _id: ObjectID(id) });

      return result;

    },

}




export {Entradas as default}