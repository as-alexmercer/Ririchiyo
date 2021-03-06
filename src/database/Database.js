const MongoClient = require('mongodb').MongoClient;
const { Collection } = require('discord.js');

const GuildData = require('./structures/GuildData');
const UserData = require('./structures/UserData');
const ClientData = require('./structures/ClientData');
const PlaylistData = require('./structures/PlaylistData');
//const PremiumTokenData = require('./structures/PremiumTokenData');
const { ObjectId } = require('mongodb');

module.exports = class Database {
    constructor(uri) {
        this.client = new MongoClient(uri, { useUnifiedTopology: true });
        this.cache = {
            clients: new Collection(),
            users: new Collection(),
            guilds: new Collection(),
            playlists: new Collection(),
            premiumTokens: new Collection()
        }
    }

    async connect(databaseName) {
        try {
            await this.client.connect();
            const connection = this.client.db(databaseName);
            this.collections = {
                clients: connection.collection("clients"),
                users: connection.collection("users"),
                guilds: connection.collection("guilds"),
                playlists: connection.collection("playlists"),
                premiumTokens: connection.collection("premiumTokens")
            };
            this.connection = connection;
            console.log(`Database connected: ${databaseName}`);
            this.collections.users.watch(console.log)
            return connection;
        } catch {
            throw new Error("Could not connect to the database");
        }
    }

    async getGuild(id) {
        if (!this.connection) throw new Error("Not connected to the database");
        const cache = this.cache.guilds.get(id);
        if (cache) return cache;
        else {
            const fetchedData = await this.collections.guilds.findOne({ "_id": id }) || { "_id": id };
            const guild = new GuildData(this.collections.guilds, fetchedData, this);
            this.cache.guilds.set(id, guild);
            return guild;
        }
    }

    async getUser(id) {
        if (!this.connection) throw new Error("Not connected to the database");
        const cache = this.cache.users.get(id);
        if (cache) return cache;
        else {
            const fetchedData = await this.collections.users.findOne({ "_id": id }) || { "_id": id };
            const user = new UserData(this.collections.users, fetchedData, this);
            this.cache.users.set(id, user);
            return user;
        }
    }

    async getPlaylist(userID, name) {
        if (!this.connection) throw new Error("Not connected to the database");
        const cache = this.cache.playlists.get({ userID, name });
        if (cache) return cache;
        else {
            const fetchedData = await this.collections.playlists.findOne({ userID, name }) || await this.collections.playlists.findOne({ "_id": name }) || { userID, name };
            const playlist = new PlaylistData(this.collections.playlists, fetchedData);
            this.cache.playlists.set({ userID, name }, playlist);
            return playlist;
        }
    }

    async getClient(id) {
        if (!this.connection) throw new Error("Not connected to the database");
        const cache = this.cache.clients.get(id);
        if (cache) return cache;
        else {
            const fetchedData = await this.collections.clients.findOne({ "_id": id }) || { "_id": id };
            const client = new ClientData(this.collections.clients, fetchedData);
            this.cache.clients.set(id, client);
            return client;
        }
    }

    // async getPremiumToken(id) {
    //     if (id) id = ObjectId(id);
    //     if (!this.connection) throw new Error("Not connected to the database");
    //     const cache = this.cache.premiumTokens.get(id);
    //     if (cache) return cache;
    //     else {
    //         const fetchedData = await this.collections.premiumTokens.findOne({ "_id": id });
    //         if (!fetchedData) return;
    //         fetchedData._id = fetchedData._id.toString();
    //         const premiumToken = new PremiumTokenData(this.collections.premiumTokens, fetchedData);
    //         this.cache.premiumTokens.set(id, premiumToken);
    //         return premiumToken;
    //     }
    // }

    // async generatePremiumToken(purchasedByID, durationMs, giftable, isVotingReward, allowedBoosts, additionalData) {
    //     if (!this.connection) throw new Error("Not connected to the database");
    //     const premiumToken = {
    //         "giftable": giftable,
    //         "renewals": [
    //             {
    //                 "renewedByID": purchasedByID,
    //                 "renewedOn": Date.now(),
    //                 "expiry": Date.now() + durationMs,
    //                 "isVotingReward": isVotingReward,
    //                 "allowedBoosts": allowedBoosts,
    //                 "additionalData": additionalData
    //             }
    //         ]
    //     }
    //     const inserted = await this.collections.premiumTokens.insertOne(premiumToken);
    //     if (inserted && inserted.insertedId) {
    //         premiumToken._id = inserted.insertedId.toString();
    //         return new PremiumTokenData(this.collections.premiumTokens, premiumToken);
    //     }
    //     else return;
    // }


}