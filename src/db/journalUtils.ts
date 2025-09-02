export async function addJournal(text: string, images: string[], isPublic: boolean): Promise<void> {
  console.log('Simulating addJournal:', { text, images, isPublic });
}

export async function likeJournal(journalId: string): Promise<void> {
  console.log('Simulating likeJournal for ID:', journalId);
}
