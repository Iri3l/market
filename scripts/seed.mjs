import 'dotenv/config'
import mongoose from 'mongoose'
import Listing from '../lib/models/Listing.js' // if using TS, compile or adjust path

const data = [
  { title: 'BMW E46 Coilovers', make: 'BMW', model: 'E46', year: 2004, price: 250, part: true },
  { title: 'Audi A4 B8 2.0TDI', make: 'Audi', model: 'A4', year: 2012, price: 3900, part: false },
  { title: 'VW Golf MK7 Headlights', make: 'VW', model: 'Golf', year: 2016, price: 180, part: true },
  { title: 'Honda Civic Type R (EP3)', make: 'Honda', model: 'Civic', year: 2005, price: 5200, part: false }
]
await mongoose.connect(process.env.MONGO_URI)
await Listing.deleteMany({})
await Listing.insertMany(data)
console.log('Seeded listings:', data.length)
await mongoose.disconnect()
