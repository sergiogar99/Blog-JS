import { MongoClient, ObjectID } from "mongodb";
import { GraphQLServer } from "graphql-yoga";
import *as uuid from 'uuid';

import "babel-polyfill";

//"mongodb+srv://sergio:123pez@cluster0-dikpx.gcp.mongodb.net/test?retryWrites=true&w=majority"

const usr = "sergio";
const pwd = "123pez";
const url = "cluster0-dikpx.gcp.mongodb.net/test?retryWrites=true&w=majority";

/**
 * Connects to MongoDB Server and returns connected client
 * @param {string} usr MongoDB Server user
 * @param {string} pwd MongoDB Server pwd
 * @param {string} url MongoDB Server url
 */
const connectToDb = async function(usr, pwd, url) {
  const uri = `mongodb+srv://${usr}:${pwd}@${url}`;
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await client.connect();
  return client;
};


/**
 * Starts GraphQL server, with MongoDB Client in context Object
 * @param {client: MongoClinet} context The context for GraphQL Server -> MongoDB Client
 */
const runGraphQLServer = function(context) {
  const typeDefs = `

    type Query{

      getAutor(name:String!):Autores
      getEntradas(name: String):[Entradas]

    }

    type Mutation{

      addAutor(name:String!,password:String!):Autores!
      addEntrada(name:String!,token:ID!,fecha:String!,concepto:String!,mensaje:String!):Entradas!

      login(name:String!,password:String!):Autores!
      logout(name:String!,token:ID!):Autores!     
      
      removeAutor(name:String!,token:ID!):String
      removeEntrada(name:String!,token:ID!,id:ID!):String

    }
  
    type Autores{

      _id: ID!
      name: String!
      password: String!
      token : ID!
      entradas : [Entradas]

    }

    type Entradas{

      _id: ID!
      idAutor : ID!
      fecha: String!
      concepto: String!
      mensaje: String!
      autor: Autores

    }
    
  `;

  

  const resolvers = {

    Autores:{

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


    },

    Entradas:{

      autor:async (parent, args, ctx, info)=>{

       
        const id= parent.idAutor;
        
        const { client } = ctx;
        const db = client.db("Blog2");
        const collection = db.collection("autores");
        const result = await collection.findOne({ _id: ObjectID(id) });

        return result;

      },

    },

    Query:{

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

    },

    Mutation:{

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
        const { client } = ctx;
        const db = client.db("Blog2");
        const collection = db.collection("autores");

        //ver si exite el usuario

        const user = await collection.findOne({name:name,token:token});

        if(user){

          const collection = db.collection("entradas");

          const idAutor = user._id;
          
          const result = await collection.insertOne({idAutor,fecha,concepto,mensaje});

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
   
  };

  const server = new GraphQLServer({ typeDefs, resolvers, context });
  const options = {
    port: 7560
  };

  try {
    server.start(options, ({ port }) =>
      console.log(
        `Server started, listening on port ${port} for incoming requests.`
      )
    );
  } catch (e) {
    console.info(e);
    server.close();
  }
};

const runApp = async function() {
  const client = await connectToDb(usr, pwd, url);
  console.log("Connect to Mongo DB");
  try {
    runGraphQLServer({ client });
  } catch (e) {
    console.log(e);
    client.close();
  }
};

runApp();


