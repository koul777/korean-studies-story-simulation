# Korean Studies Story Game

한국학 인사팀 세계관을 바탕으로 만든 선택형 스토리 게임입니다. 플레이어는 인사팀 실습생 서하린과 기록의 수호신 해치와 함께 불완전한 기록을 조사하고, 선택에 따라 절차 중심, 회복 중심, 개혁 조율형 경로로 다른 결말에 도달합니다.

## 핵심 변경 방향

- 반복 캐릭터 애니메이션을 제거하고 정지 캐릭터 컷으로 교체했습니다.
- 하린과 해치 캐릭터 시트를 사용해 장면에 따라 `idle`, `search`, `brief`, `judge`, `low` 정지 포즈가 다르게 보이도록 구성했습니다.
- 배경은 캐릭터 반복 화면이 아니라 상황별 장면 이미지로 분리했습니다.
- 서버 로그실, 증언 대기실, CCTV 검토실, 규정 아카이브, 공개 토론장, 청문 패널룸, 징계 판정석, 화해 데스크, 개혁 설계실 등으로 장면을 다양화했습니다.
- 선택 결과가 한 장면에서 끝나지 않도록 route memory, branch result, follow-up consequence scene으로 다음 장면에 이어지게 했습니다.
- 마지막 선택이 전체 결말을 덮어쓰지 않고, 누적 선택과 스탯이 함께 결말을 결정하도록 조정했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 뜨면 브라우저에서 표시된 로컬 주소를 엽니다. 일반적으로 다음 주소 중 하나입니다.

```text
http://localhost:3000/
http://localhost:3001/
```

## 주요 파일

- `app/StoryGame.tsx`: 게임 UI, 정지 캐릭터 컷, 선택 처리, 저장/이어하기, 캡처 route 처리
- `app/story.ts`: 7장 구성 스토리, 선택지, 분기 플래그, route gate, 엔딩 결정 로직
- `app/sceneArt.ts`: 장면별 배경 이미지 매핑과 fallback 규칙
- `app/globals.css`: 전체 화면 레이아웃, 상황별 배경, 정지 캐릭터 컷 스타일
- `public/game/scenes/`: 상황별 SVG 배경
- `public/game/characters/`: 하린/해치 캐릭터 시트 기반 정지 컷 소스
- `public/game/reference/`: 제공된 참고 화면 이미지
- `tests/`: 스토리 분기와 SSR 렌더링 기준 테스트
- `reports/story-scene-implementation-summary.md`: 구현 진행 요약

## 캡처용 장면 route

SSR 또는 화면 확인용으로 `scene` query를 사용할 수 있습니다.

```text
/?scene=server-room
/?scene=forest-crossroads
/?scene=review-room
/?scene=bridge-order
/?scene=panel-expert
/?scene=cross-summary-followup
```

캡처 route는 실제 저장 데이터를 변경하지 않고 해당 장면을 바로 렌더링합니다.

## 검증 명령

```bash
npm run build
node --test tests/*.test.mjs
npm run lint
```

이번 작업에서는 사용자가 별도로 요청하지 않은 검증 명령은 자동 실행하지 않습니다.

## 공개 전 주의

이 저장소에는 제공된 캐릭터 시트와 참고 이미지가 포함됩니다. public GitHub 저장소로 푸쉬하면 해당 이미지도 공개됩니다.
