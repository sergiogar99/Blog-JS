import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';
import { PubSub } from "graphql-yoga";
import "babel-polyfill";


const Mutation = {

    addAutor:async (parent, args, ctx, info) => {  

      const { name,password } = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      //ver si exite el usuario

      const user = await collection.findOne({name:name});

      if(!user){

        //generar token con uuid

        const token = uuid.v4();
        const result = await collection.insertOne({name,password,token});

        return {

          name,            
          password,
          token,
          _id:result.ops[0]._id

        };

      }
    },

    addEntrada:async (parent, args, ctx, info) => {  
      
      const { name,token,fecha,concepto,mensaje } = args;
      const { client,pubsub } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      //ver si exite el usuario

      const user = await collection.findOne({name:name,token:token});

      if(user){

        const collection = db.collection("entradas");

        const idAutor = user._id;
        
        const result = await collection.insertOne({idAutor,fecha,concepto,mensaje});


        //buscar entrada
        //const entrada = await collection.findOne({idAutor:idAutor,concepto:concepto});

        pubsub.publish(
          idAutor,
          {
            tellAutor: {
              
              idAutor,            
              fecha,
              concepto,
              mensaje,
              _id:result.ops[0]._id

            }
          }
        );

        pubsub.publish(
          concepto,
          {
            tellEntradaConcepto: {
              
              idAutor,            
              fecha,
              concepto,
              mensaje,
              _id:result.ops[0]._id

            }
          }
        );



        return {

          idAutor,            
          fecha,
          concepto,
          mensaje,
          _id:result.ops[0]._id

        };

      }else{

        throw new Error('Usuario no encontrado');

      }

    },

    login:async (parent, args, ctx, info) => {  
      
      const { name,password } = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      //ver si exite el usuario

      let user = await collection.findOne({name:name,password:password});

      if(user){

        //actualizamos el token del usuario
        await collection.updateOne({"name": name }, { $set: { "token": uuid.v4() }});

        user = await collection.findOne({name:name,password:password});
        
        return user;

      }else{

        throw new Error('Usuario no encontrado');

      }

    },

    logout:async (parent, args, ctx, info) => {  
      
      const { name,token} = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      const collection = db.collection("autores");

      //ver si exite el usuario

      let user = await collection.findOne({name:name,token:token});

      if(user){

        //ponemos el token a null, lo invalidamos
        await collection.updateOne({"name": name }, { $set: { "token": null}});

        user = await collection.findOne({name:name});
        
        return user;

      }else{

        throw new Error('Usuario no encontrado');

      }

    },

    removeAutor:async (parent, args, ctx, info) => {  
      
      const { name,token } = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      let collection = db.collection("autores");
      //ver si exite el usuario


      const user = await collection.findOne({name:name,token:token});

      if(user){

        const id = user._id;

        await collection.deleteOne({name:{$eq:name}}); 

        collection = db.collection("entradas");
        await collection.remove({idAutor:{$eq:id}},false);

        return user.name + " ha sido borrado";

      }else{

        throw new Error('Usuario no encontrado.');
      }

    },

    removeEntrada:async (parent, args, ctx, info) => {  
      
      const { name,token,id} = args;
      const { client } = ctx;
      const db = client.db("Blog2");
      let collection = db.collection("autores");

      const user = await collection.findOne({name:name,token:token});

      if(user){

        let collection = db.collection("entradas");

        await collection.deleteOne({_id:{$eq:ObjectID(id)}});

        return "se ha borrado la factura.";

      }else{

        throw new Error('Usuario no encontrado');
      }

    },

}




export {Mutation as default}