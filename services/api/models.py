import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.types import TypeDecorator, CHAR
from database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type or CHAR(36) for other databases.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(value)
        return value


class Submission(Base):
    """Database model for review submissions."""
    
    __tablename__ = "submissions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # User input
    rating = Column(Integer, nullable=False)
    review_text = Column(Text, nullable=False)
    
    # AI-generated outputs (NULL until Phase 3)
    user_response = Column(Text, nullable=True)
    admin_summary = Column(Text, nullable=True)
    admin_recommended_actions = Column(JSON, nullable=True)
    
    # LLM metadata
    llm_model = Column(String(100), nullable=True)
    prompt_version = Column(String(50), nullable=True)
    llm_latency_ms = Column(Integer, nullable=True)
    llm_error = Column(Text, nullable=True)
