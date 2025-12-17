import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Video, CheckCircle, Bookmark, AlertCircle, Edit, Trash2 } from "lucide-react";
import { LazyImage } from "@/components/LazyImage";
import { getDifficultyLabel, getFigureTypeLabel } from "@/lib/figureUtils";

interface LibraryGridViewProps {
  figures: any[];
  onFigureClick: (figure: any) => void;
  canModifyFigure: (figure: any) => boolean;
  getDifficultyColor: (difficulty: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  onEdit: (figure: any) => void;
  onDelete: (figure: any) => void;
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({
  figures,
  onFigureClick,
  canModifyFigure,
  getDifficultyColor,
  getStatusIcon,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {figures.map((figure) => (
        <Card
          key={figure.id}
          className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group overflow-hidden"
          onClick={() => onFigureClick(figure)}
        >
          <CardContent className="p-0">
            <div className="relative aspect-[4/5] md:aspect-square overflow-hidden">
              {figure.image_url ? (
                <LazyImage
                  src={figure.image_url}
                  alt={figure.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  skeletonClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <span className="text-6xl">🤸</span>
                </div>
              )}

              {/* Premium badge - removed, only sport paths are paid */}

              {/* Status icon */}
              {getStatusIcon(figure.progress_status) && (
                <div className="absolute top-2 md:top-3 left-2 md:left-3 z-10 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                  {getStatusIcon(figure.progress_status)}
                </div>
              )}

              {/* Video indicator */}
              {figure.video_url && (
                <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 z-10">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span className="hidden sm:inline">Wideo</span>
                  </div>
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Exercise type badge */}
              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 z-10">
                <div
                  className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium ${
                    figure.type === "single_figure"
                      ? "bg-blue-500/90 text-white"
                      : figure.type === "combo"
                      ? "bg-purple-500/90 text-white"
                      : "bg-orange-500/90 text-white"
                  }`}
                >
                  {getFigureTypeLabel(figure.type)}
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4">
              {/* Header with title and edit buttons */}
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm md:text-base leading-tight mb-2 line-clamp-2">
                    {figure.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getDifficultyColor(
                        figure.difficulty_level
                      )} text-xs border font-medium`}
                    >
                      {getDifficultyLabel(figure.difficulty_level)}
                    </Badge>
                    <span className="text-white/60 text-xs capitalize">
                      {figure.category}
                    </span>
                  </div>
                </div>

                {canModifyFigure(figure) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-white/20 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(figure);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-white/20 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(figure);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags section - show only 2 on mobile */}
              {figure.tags && figure.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {figure.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-md hover:bg-white/20 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                  {figure.tags.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-white/10 text-white/60 rounded-md">
                      +{figure.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
