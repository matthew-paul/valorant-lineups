import { normalizeYouTubeVideo } from "../../services/youtube-video";

export interface YoutubeEmbedProps {
  embedId: string;
}

const YoutubeEmbed = ({ embedId }: YoutubeEmbedProps): JSX.Element | null => {
  const video = normalizeYouTubeVideo(embedId);
  if (video === null) return null;
  const url = new URL(`https://www.youtube.com/embed/${video}`);
  url.searchParams.set("rel", "0");

  return (
    <div className="video-responsive">
      <iframe
        src={url.toString()}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
      />
    </div>
  );
};

export default YoutubeEmbed;
