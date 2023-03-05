const { buildSchema } = require("graphql");

module.exports = buildSchema(`
type Booking {
    _id: ID!
    event: Event!
    user: User!
    createdAt: String!
    updatedAt: String!
}

type Event {
  _id: ID!
  title: String!
  description: String!
  price: Float!
  date: String!
  creator: User!
}

type Place{
  _id: ID!
  title: String!
  description: String!
  image: String!
  address: String!
  location: Location!
  creator: User!
}

type Review{
  _id: ID!
  title: String!
  description: String!
  image: String!
  creator: User!
}

type Location{
  _id: ID!
  lat: Float!
  lng: Float!
}

type User {
  _id: ID!
  name: String!
  email: String!
  password: String
  image: String
  createdReviews: [Review]
  createdPlaces: [Place]
  createdEvents: [Event]
  createdPosts: [Post]
}

type AuthData {
  userId: ID!
  token: String!
  tokenExpiration: Int!
}

type Post {
  _id: ID!
  title: String!
  content: String!
  imageUrl: String!
  creator: User!
  createdAt: String!
  updatedAt: String!
}

type PostData {
  posts: [Post!]!
  totalPosts: Int!
}

input PostInputData {
  title: String!
  content: String!
  imageUrl: String!
}

input EventInput {
  title: String!
  description: String!
  price: Float!
  date: String!
}

input UserInput {
  name: String!
  email: String!
  password: String!
  image: String!
}

input CreateReviewInput {
  title: String!
  description: String!
  image: String
}

input UpdateReviewInput {
  title: String!
  description: String!
  reviewId: String!
}

input DeleteReviewInput {
  reviewId: String!
}

input GetReviewByIdInput {
  reviewId: String!
}

input GetReviewsByUserIdInput{
  userId: String!
}

input CreatePlaceInput {
  title: String!
  description: String!
  image: String!
  address: String!
}

input UpdatePlaceInput {
  title: String!
  description: String!
  placeId: String!
}

input DeletePlaceInput {
  placeId: String!
}

input GetPlaceByIdInput {
  placeId: String!
}

input GetPlacesByUserIdInput{
  userId: String!
}

type RootQuery {
    posts(page: Int): PostData!
    post(id: ID!): Post!
    getReviews: [Review]
    getPlaces: [Place]
    getUsers: [User]
    events: [Event]
    bookings: [Booking!]!
    login(email: String!, password: String!): AuthData!
}

type RootMutation {
    createPost(postInput: PostInputData): Post
    updatePost(id: ID!, postInput: PostInputData): Post
    deletePost(id: ID!): Boolean
    getReviewById(getReviewByIdInput: GetReviewByIdInput): Review
    getReviewsByUserId(getReviewsByUserIdInput: GetReviewsByUserIdInput): [Review]
    createReview(createReviewInput: CreateReviewInput): Review
    updateReview(updateReviewInput: UpdateReviewInput): Review
    deleteReview(deleteReviewInput: DeleteReviewInput): [Review]
    getPlaceById(getPlaceByIdInput: GetPlaceByIdInput): Place
    getPlacesByUserId(getPlacesByUserIdInput: GetPlacesByUserIdInput): [Place]
    createPlace(createPlaceInput: CreatePlaceInput): Place
    updatePlace(updatePlaceInput: UpdatePlaceInput): Place
    deletePlace(deletePlaceInput: DeletePlaceInput): [Place]
    createEvent(eventInput: EventInput): Event
    createUser(userInput: UserInput): User
    bookEvent(eventId: ID!): Booking!
    cancelBooking(bookingId: ID!): Event!
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);
