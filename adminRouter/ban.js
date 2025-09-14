import { fetchComments, getRatings, issueBan } from "../database/db.js";

export async function banSellersWithMoreThan15Complains(email) {
  try {
    const comment = await fetchComments(email);
    const rating = await getRatings(email);

    const banApproved = `There are a lot of complains on the profile ${email} which resulted in a ban, please reach out to the help desk for further instructions.`;
    const banNotApproved = "";

    // Handle case where fetchComments returns { error: ... }
    if (!comment.comments || !Array.isArray(comment.comments.complains)) {
      return {message: banNotApproved};
    }

    // Handle case where rating.rate is empty
    const sellerRating = rating.rate?.[0]?.rating ?? 3;

    if (comment.comments.complains.length >= 15 && sellerRating <= 2) {
      const banUser = await issueBan(email);
      if (banUser.error) return banUser.error;
      return {error: banApproved};
    }

    return {message: banNotApproved};
  } catch (err) {
    console.error(err);
    return { err: "An error occurred" };
  }
}
