//require("dotenv").config({ path: "./.env" });
import 'dotenv/config'
import connectDB from './db/dbConnection.js'
connectDB()
  .then(() => {
    app.on('ERROR', (err) => {
      console.log('Error:', err)
    })
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`)
    })
  })
  .catch((err) => {
    console.log('Error:', err)
  })
