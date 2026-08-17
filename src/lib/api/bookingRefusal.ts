import { Errors } from "@/lib/api/errors";

// Why a booking was refused, as the response that says what to do about it.
//
// Out of the route handler because the handler is capped at eighty lines and
// this is a lookup table, not logic — it maps one domain outcome onto one HTTP
// answer and has no decisions of its own.
export function bookingRefusal(reason: string) {
  switch (reason) {
    case "listing-not-found":
      return Errors.notFound("Listing");
    case "not-accepting":
      return Errors.conflict("This coach is not taking new students right now.");
    case "self-booking":
      return Errors.forbidden("You cannot book your own session.");
    case "slot-required":
      return Errors.validation("Pick a time for this session.");
    // A 409 so the client refreshes the slots rather than retrying blindly.
    case "slot-taken":
      return Errors.conflict("That time has just been taken. Pick another.");
    case "material-required":
      return Errors.validation("Add a match or a video link for the coach to review.");
    case "account-not-owned":
      return Errors.riotAccountNotOwned();
    case "too-many-pending":
      return Errors.conflict(
        "You already have requests waiting with this coach. Give them a chance to answer those first."
      );
    default:
      return Errors.validation("That booking could not be made.");
  }
}
