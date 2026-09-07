export type PreviewInput = {
    title: string;
    expectedPublicationDate: string | null;
    isVisible: boolean;
    displayOrder: number | null;
    coverSource: 'preview' | 'book' | null;
    coverPath: string | null;
    videoEnabled: boolean;
    videoPlaybackId: string | null;
    videoTitle: string | null;
    videoViewerUid: string | null;
    videoPlacement: 'left' | 'right';
    extractEnabled: boolean;
    extractSource: 'text' | 'images';
    extractHtml: string | null;
    extractImagePaths: string[];
};

export type BookPreview = PreviewInput & { bookId: string; bookCover: string | null };
export type PublicBookPreview = {
    bookId: string;
    title: string;
    expectedPublicationDate: string | null;
    coverUrl: string | null;
    video: { playbackId: string; title: string; viewerUid: string | null; placement: 'left' | 'right' } | null;
    extract: { source: 'text'; html: string } | { source: 'images'; images: string[]; pagesCount: number } | null;
};
