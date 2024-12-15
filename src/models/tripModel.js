const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: { type: Number, required: true },
  tripNumber: { type: String, required: true },
  tripDate: { type: String, required: true }, // Store date as 'YYYY-MM-DD'
  bookingStatus: { type: String, required: true },
  confirmedSeats: { type: [Number], default: [] }, // Array to store confirmed seat numbers
  availableSeats: { type: [Number], default: [] }, // Array to store available seat numbers
  numberCapacity: { type: Number, required: true }, // Total seat capacity
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
  ac: { type: Boolean, required: true },
});

// Pre-save hook to format tripDate as 'YYYY-MM-DD'
tripSchema.pre('save', function (next) {
  if (this.tripDate) {
    const normalizedDate = new Date(this.tripDate);
    if (!isNaN(normalizedDate)) {
      this.tripDate = normalizedDate.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
    }
  }
  next();
});

// Automatically remove _id and __v from response
tripSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id; // Remove _id
    delete ret.__v; // Remove __v
    return ret; // Return the transformed object
  },
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
