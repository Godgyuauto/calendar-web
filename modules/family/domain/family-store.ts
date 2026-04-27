export * from "@/modules/family/domain/types";
export * from "@/modules/family/domain/events";
export * from "@/modules/family/domain/overrides";

// TODO(db): 현재는 인메모리 저장소이며 재시작 시 데이터가 사라집니다. Supabase 연결 후 Repository 레이어로 교체 필요.
// TODO(security): familyId/userId를 요청에서 그대로 신뢰하지 않도록 auth.uid() 기반 서버 검증으로 전환 필요.
