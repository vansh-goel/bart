// src/components/AccountSettingsDialog.tsx
"use client"; // Ensure this is kept at the top
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AccountSettingsDialogProps {
  isOpen: boolean;
  handleClose: () => void;
}

const AccountSettingsDialog: React.FC<AccountSettingsDialogProps> = ({
  isOpen,
  handleClose,
}) => {
  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeType, setChangeType] = useState<"email" | "password">("email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/updateUser", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: changeType === "email" ? email : undefined, // Only include email if changing email
          currentPassword,
          newEmail: changeType === "email" ? email : undefined, // Only include newEmail if changing email
          newPassword: changeType === "password" ? newPassword : undefined, // Only include newPassword if changing password
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        handleClose(); // Close the dialog on success
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating account settings:", error);
      alert("An error occurred while updating account settings.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dark:bg-black/70 dark:text-white border-purple-300 border-2 rounded-2xl shadow-sm shadow-white">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Update your account settings here.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <label className="block text-sm font-medium">Change:</label>
          <select
            value={changeType}
            onChange={(e) =>
              setChangeType(e.target.value as "email" | "password")
            }
            className="mt-1 block w-full p-2 border text-black bg-gray-50"
          >
            <option value="email">Change Email</option>
            <option value="password">Change Password</option>
          </select>
        </div>
        <form onSubmit={handleSubmit}>
          {changeType === "email" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium">New Email</label>
                <input
                  type="email"
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
          {changeType === "password" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Current Email
                </label>
                <input
                  type="text"
                  value={email ?? ""}
                  readOnly
                  className="mt-1 block w-full p-2 border border-gray-300 text-black rounded bg-gray-200"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-300 text-black hover:text-white"
            >
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsDialog;
