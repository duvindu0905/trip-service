const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: { type: Number, required: true },
  tripNumber: { type: String, required: true },
  tripDate: { type: Date, required: true },
  bookingStatus: { type: String, required: true },
  confirmedSeatsCount: { type: Number, required: true },
  availableSeatsCount: { type: Number, required: true },
  routeNumber: { type: String, required: true },
  routeName: { type: String, required: true },
  travelDistance: { type: String, required: true },
  travelDuration: { type: String, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  scheduleId: { type: Number, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  permitNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  busType: { type: String, required: true },
  pricePerSeat: { type: Number, required: true },
  music: { type: Boolean, required: true },
  ac: { type: Boolean, required: true }
});

// Automatically remove _id and __v from response
tripSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;

