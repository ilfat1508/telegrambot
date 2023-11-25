const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'boot_game',
    'ilfat',
    'bootgame',
    {
        host: 'localhost',
        port: '5432',
        dialect: 'postgres'
    }
)