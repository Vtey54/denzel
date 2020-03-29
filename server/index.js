const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {PORT} = require('./constants');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./imdb.js')
const graphqlHTTP = require('express-graphql');
const {GraphQLSchema} = require('graphql');


const { GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList
} = require('graphql');

const CONNECTION_URL = "mongodb+srv://Pierre:17101998@denzel-cjyz3.mongodb.net/test?retryWrites=true&w=majority"
const DATABASE_NAME = "Denzel";

const app = express();
module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


app.get('/movies/populate/:id', async (request, response) => {
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true },async (error, client) => {
        try {
            var movies = await imdb(request.params.id);
            database.collection("movies").insertMany(movies, function(err, res) {
            if (err) throw err;
            console.log(res.insertedCount+" documents inserted");
            response.send(res.insertedCount+" documents inserted");
            // close the connection to db when you are done with it
            client.close();
        
        });

        }catch(error){
            console.log(error);
        }
        
    })

});

app.get('/movies', (request, response) => {
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true }, (error, client) => {

        var queryAgg = [{ $sample: { size: 1 } }];
        database.collection("movies").aggregate(queryAgg, function(error,cursor){
            if(error) return callback(error);
            cursor.toArray(function(err,movie){
                if(error) return callback(error);
                console.log(movie);
                response.send(movie);
            })
        });
    })
});

app.get('/movies/search', (request, response) => {
    
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true }, (error, client) => {
        var limit = parseInt(request.query.limit,10) || 5;
        var metascore = parseInt(request.query.metascore,10) || 0;
        var result = {'limit':limit,'total':0};
        var query = { "metascore" : {$gte:metascore}};
        
        var cursor = database.collection("movies").find(query).limit(limit);
        cursor.toArray(function(err,movie){
                if(error) return callback(error);
                result.results=movie;
                result.total = result.results.length;
                response.send(result);
            });
    })
});

app.get('/movies/:id', (request, response) => {
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true }, (error, client) => {

        var query = { "id" : request.params.id};
        database.collection("movies").find(query, function(error, cursor){
            if(error) return callback(error);
            cursor.toArray(function(err,movie){
                if(error) return callback(error);
                console.log(movie);
                response.send(movie);
            })
            
        });
    })
});


app.post('/movies/:id', (request, response) => {
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true }, (error, client) => {
        var review ={'id':request.params.id,'date':request.body.date,'review':request.body.review};
        var query = { "id" : request.params.id};
        var update = {$set : {date:review.date, review: review.review}};
        database.collection('movies').updateOne(query, update, function(error,data){
            if(error) return callback(error);
            response.send('updated ');
        });
        
    })
});


movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: function (){
        return {
            id: { type: GraphQLString },
            link: { type: GraphQLString },
            metascore: { type:GraphQLInt },
            poster: { type: GraphQLString },
            rating: { type: GraphQLFloat },
            synopsis: { type: GraphQLString },
            title: { type: GraphQLString },
            vote: { type: GraphQLFloat },
            year: { type: GraphQLInt }
        }
        

    }
});

//Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        },
        populate : {
            type: GraphQLString,
            
            args:{
                id:{type: GraphQLString}

            },
            resolve:async function(source, args){
                MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true },async (error, client) => {
                try {
                    var movies = await imdb(args.id);
                    database.collection("movies").insertMany(movies, function(err, res) {
                    if (err) throw err;
                    // close the connection to db when you are done with it
                    client.close();
        
                    });

                }catch(error){
                    console.log(error);
                }

        
                })
                return "documents will be inserted in approximately 15s";
            }
        },
        randomMovie:{
            type: new GraphQLList(movieType),
            resolve: function(source,args){
                return database.collection("movies").aggregate([{ $sample: {size : 1}}]).toArray();
                
            }
        },
        moviesId:{
            type: new GraphQLList(movieType),
            args:{
                id:{type: GraphQLString}
            },
            resolve:function(source,args){
                return database.collection("movies").find({ "id" : args.id}).toArray();
            }
        },
        denzelMovies:{
            type: new GraphQLList(movieType),
            args:{
                limit:{type: GraphQLInt},
                metascore:{type:GraphQLInt}
            },
            resolve:function(source,args){
                return database.collection("movies").find({ "metascore" : {$gte:args.metascore}}).limit(args.limit).toArray();

            }
        },
        saveReview:{
            type: GraphQLString,
            args:{
                date:{type: GraphQLString},
                review:{type:GraphQLString},
                id:{type:GraphQLString}
            },
            resolve:function(source,args){

                database.collection('movies').updateOne({ "id" : args.id}, {$set : {'date':args.date, 'review': args.review}});
                return 'updated';
            }
        }


    }
});



const schema = new GraphQLSchema({ query: queryType });

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));


// use : nodemon ../../index.js

       





