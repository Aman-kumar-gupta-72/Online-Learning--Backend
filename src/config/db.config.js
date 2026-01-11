import mangoose from 'mongoose'

  export const ConectDb = async () => {
    try {
        console.log('Ekdum pagal bala bat karo hai connect ho raha hai na ji');
        await mangoose.connect(process.env.MONGO_URL)
        console.log(`👏 connect hai👌👌👌👌👌:${mangoose.connection.host}`);
        
    } catch (error) {
         console.log(`🤬🤬 nai hobaou jo: `, error.message);
         
    }


}


