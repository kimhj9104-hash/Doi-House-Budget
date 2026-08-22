import { doc, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addNote(
  householdId: string,
  uid: string,
  title: string,
  content: string,
) {
  await addDoc(collection(db, "households", householdId, "notes"), {
    title,
    content,
    uid,
    createdAt: Date.now(),
  });
}

export async function updateNote(
  householdId: string,
  noteId: string,
  input: { title: string; content: string },
) {
  await updateDoc(doc(db, "households", householdId, "notes", noteId), {
    ...input,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(householdId: string, noteId: string) {
  await deleteDoc(doc(db, "households", householdId, "notes", noteId));
}
