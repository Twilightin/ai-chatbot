import { FileText, File as FileIcon } from "lucide-react";
import Image from "next/image";
import type { Attachment } from "@/lib/types";
import { Loader } from "./elements/loader";
import { CrossSmallIcon } from "./icons";
import { Button } from "./ui/button";

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div
      className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
      data-testid="input-attachment-preview"
    >
      {contentType?.startsWith("image") ? (
        <Image
          alt={name ?? "An image attachment"}
          className="size-full object-cover"
          height={64}
          src={url}
          width={64}
        />
      ) : contentType === "application/pdf" ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          <FileText size={24} strokeWidth={2} />
          <span className="font-medium text-[9px]">PDF</span>
        </div>
      ) : contentType === "text/plain" ? (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
          <FileIcon size={24} strokeWidth={2} />
          <span className="font-medium text-[9px]">TXT</span>
        </div>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
          <FileIcon size={24} strokeWidth={2} />
          <span className="font-medium text-[9px]">File</span>
        </div>
      )}

      {isUploading && (
        <div
	  className="absolute inset-0 flex items-center justify-center bg-black/50"
	  data-testid="input-attachment-loader"
	>
          <Loader size={16} />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
          className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          size="sm"
          variant="destructive"
        >
          <CrossSmallIcon size={8} />
        </Button>
      )}

      <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {name}
      </div>
    </div>
  );
};
