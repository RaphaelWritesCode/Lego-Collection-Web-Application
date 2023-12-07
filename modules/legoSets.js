require('dotenv').config();

const Sequelize = require('sequelize');

let sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
});

const Theme = sequelize.define('Theme', { 
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true, 
        autoIncrement: true, 
    },
    name: Sequelize.STRING
    },
    {
        createdAt: false,
        updatedAt: false,
    }
);

const Set = sequelize.define('Set', { 
    set_num: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: Sequelize.STRING,
    year: Sequelize.INTEGER,
    num_parts: Sequelize.INTEGER,
    theme_id: Sequelize.INTEGER,
    img_url: Sequelize.STRING
    },
    {
        createdAt: false,
        updatedAt: false,
});


Set.belongsTo(Theme, {foreignKey: 'theme_id'});


function initialize() {
    return new Promise(async(resolve, reject) => {
        try {
            await sequelize.sync();
            resolve();
        } catch (err) {
            reject(`Error initializing set: ${err}`);
        }
    });
}

function getAllSets() {
    return new Promise((resolve, reject) => {
        Set.findAll({
            include: [Theme] 
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            reject(`Error trying to get all sets: ${err}`);
        });
    });
}


function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
        Set.findAll({
            include: [Theme], 
            where: {
                set_num: setNum,
            },
        })
        .then(data => {
            if (data.length > 0) {
                resolve(data[0]);t
            } else {
                reject(`Unable to find set by setNum: ${setNum}`);
            }
        })
        .catch(err => {
            reject(`Error trying to get set by setNum: ${err}`);
        });
    });
}



function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
        Set.findAll({
            include: [Theme],
            where: {
                '$Theme.name$': {
                    [Sequelize.Op.iLike]: `%${theme}%`
                }
            }
        })
        .then(data => {
            if (data.length > 0) {
                resolve(data);
            } else {
                reject(`Unable to find sets by theme: ${theme}`);
            }
        })
        .catch(err => {
            reject(`Error trying to get sets by theme: ${err}`);
        });
    });
}

function addSet(setData) {
    return new Promise((resolve, reject) => {
        Set.create(setData)
        .then(() => {
            resolve();
        })
        .catch(err => {
            if (err && err.errors) {
                reject(err.errors[0].message);
            } else {
                reject('An error occurred while adding the set.');
            }
        });
    });
}



function getAllThemes() {
    return new Promise((resolve, reject) => {
        Theme.findAll()
        .then(themes => {
            resolve(themes);
        })
        .catch(err => {
            reject(`Error trying to get themes: ${err}`);
        });
    });
}

function editSet(set_num, setData) {
    return new Promise((resolve, reject) => {
        Set.update(setData, {
            where: { set_num: set_num }
        })
        .then(result => {
            if (result[0] === 0) {
                reject('No set found with the specified number, or no change made.');
            } else {
                resolve();
            }
        })
        .catch(err => {
            if (err && err.errors) { // checks if theres an error and error message
                reject(err.errors[0].message);
            } else {
                reject('An error occurred while updating the set.');
            }
        });
    });
}

function deleteSet(set_num) {
    return new Promise((resolve, reject) => {
        Set.destroy({
            where: { set_num: set_num }
        })
        .then(result => {
            if (result > 0) {
                resolve();
            } else {
                reject("Unable to delete set");
            }
        })
        .catch(err => {
            if (err.errors && err.errors[0]) {
                reject(err.errors[0].message);
            } else {
                reject("An error occurred while attempting to delete the set.");
            }
        });
    });
};

module.exports = {
    initialize,
    getAllSets,
    getSetByNum,
    getSetsByTheme,
    addSet,
    getAllThemes,
    editSet,
    deleteSet
};