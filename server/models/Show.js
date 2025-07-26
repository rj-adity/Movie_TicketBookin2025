import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
    {
        movie: {type: String, required: true, ref: 'Movie'},
        showDateTime: {type: Number, required:  true},
        showPrice: {type: Number, required:  true},
        OccupiedSeats: {type: Object, default:{} },
    }, {minimize: false}
)


const Show = mongoose.model("Show", showSchema);

export default Show;