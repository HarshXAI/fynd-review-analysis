from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


class RecommendedAction(BaseModel):
    """Schema for recommended action items."""
    action: str
    priority: str = Field(..., pattern="^(low|medium|high)$")
    owner: str = Field(..., pattern="^(support|ops|product)$")


class SubmissionCreate(BaseModel):
    """Request schema for creating a submission."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    review_text: str = Field(..., min_length=1, max_length=2000, description="Review text")
    
    @field_validator('review_text')
    @classmethod
    def validate_review_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Review text cannot be empty or whitespace only")
        if len(v) > 2000:
            v = v[:2000]  # Truncate to max length
        return v


class SubmissionResponse(BaseModel):
    """Response schema for a submission."""
    id: UUID
    rating: int
    review_text: str
    user_response: Optional[str] = None
    admin_summary: Optional[str] = None
    admin_recommended_actions: Optional[List[RecommendedAction]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    """Response schema for list of submissions."""
    submissions: List[SubmissionResponse]
    total: int


class ErrorDetail(BaseModel):
    """Error detail schema."""
    code: str = Field(..., description="Error code: VALIDATION_ERROR, LLM_ERROR, SERVER_ERROR")
    message: str


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: ErrorDetail


# ============================================================================
# Analytics Schemas (Phase 5)
# ============================================================================
class RatingCount(BaseModel):
    """Count of submissions per rating."""
    rating: int
    count: int
    percentage: float


class DailyVolume(BaseModel):
    """Daily submission volume."""
    date: str  # ISO date string YYYY-MM-DD
    count: int


class AnalyticsResponse(BaseModel):
    """Response schema for analytics endpoint."""
    total_submissions: int
    rating_distribution: List[RatingCount]
    average_rating: float
    daily_volume: List[DailyVolume]  # Last 7 days
    today_count: int
    this_week_count: int
