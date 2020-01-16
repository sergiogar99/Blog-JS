import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';
import { PubSub } from "graphql-yoga";
import "babel-polyfill";


const Subscription = {

    tellAutor:{

      subscribe: async (parent, args, ctx, info) => {

          const {id} = args;
          const {pubsub} = ctx;
          
          return pubsub.asyncIterator(id);

      }

  },

  tellEntradaConcepto:{

    subscribe: async (parent, args, ctx, info) => {

      const {concepto} = args;
      const {pubsub} = ctx;
      
      return pubsub.asyncIterator(concepto);

  }

  },
  
}






export {Subscription as default}