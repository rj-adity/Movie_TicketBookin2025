import { Inngest } from "inngest";
import User from "../../models/User.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      // Validate required data
      if (!id || !email_addresses || !email_addresses[0]) {
        throw new Error('Missing required user data');
      }

      const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        image: image_url || '',
      };

      await step.run("create-user", async () => {
        return await User.create(userData);
      });

      console.log(`User created successfully: ${userData.email}`);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    try {
      const { id } = event.data;

      if (!id) {
        throw new Error('User ID is required for deletion');
      }

      await step.run("delete-user", async () => {
        return await User.findByIdAndDelete(id);
      });

      console.log(`User deleted successfully: ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
);

// Inngest function to update user data in MongoDB
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      if (!id) {
        throw new Error('User ID is required for update');
      }

      const userData = {
        email: email_addresses?.[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        image: image_url || '',
      };

      await step.run("update-user", async () => {
        return await User.findByIdAndUpdate(id, userData, { new: true });
      });

      console.log(`User updated successfully: ${userData.email}`);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
);

// Export all the Inngest functions in an array
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
