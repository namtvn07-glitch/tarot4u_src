import { TarotCard, TopicItem } from "@/types/tarot";

export const CARD_BACK_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCMQ7TgNzaIKmSUtza16EjN59e_D9iWzcJQsxf1Vv-_YhdTn-W1Rk07WM0t0xjuXsL96UwFAX8VPmTsQWol_d5FMRtfEgH28Bo552t1VF7f1m-QCkLbMlyLGh0AcgpsRL9YBNV9sssluFMUM2m57OLBdWb9QhqkOSM34PafCu0G66DSogZgoCdvxMgf9YJ-FD8X-zJk-w7kvh5YUmxwL1heCpdBEXoNSg6t3qj4TSVyg6wLEQNy2tg";
export const VENTUS_TAROT_LOGO = "/cards/the-magician.jpg";

export const TOPICS: TopicItem[] = [
  {
    id: "general",
    nameVi: "Tổng Quan",
    descVi: "Bức tranh toàn cảnh về năng lượng và bài học cuộc sống hiện tại.",
    icon: "explore"
  },
  {
    id: "love",
    nameVi: "Tình Yêu",
    descVi: "Thấu hiểu các mối liên kết, rung động cảm xúc và chữa lành trái tim.",
    icon: "favorite"
  },
  {
    id: "career",
    nameVi: "Sự Nghiệp",
    descVi: "Soi sáng hướng đi nghề nghiệp, thử thách và cơ hội thăng tiến.",
    icon: "work"
  },
  {
    id: "finance",
    nameVi: "Tài Chính",
    descVi: "Dòng chảy thịnh vượng, đầu tư và cách quản lý tài nguyên.",
    icon: "monetization_on"
  },
  {
    id: "spiritual",
    nameVi: "Tâm Linh",
    descVi: "Khai mở trực giác, khám phá bóng tối nội tâm và phát triển nhận thức.",
    icon: "self_improvement"
  }
];

export const TAROT_CARDS: TarotCard[] = [
  {
    "id": "the-fool",
    "number": 0,
    "name": "The Fool",
    "nameVi": "Kẻ Khờ",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-fool.jpg",
    "image": "/cards/the-fool.jpg",
    "image_filename": "the-fool.jpg",
    "uprightKeywords": [
      "khởi đầu mới",
      "tự do",
      "ngây thơ",
      "phiêu lưu",
      "tự phát",
      "niềm tin"
    ],
    "reversedKeywords": [
      "liều lĩnh",
      "bốc đồng",
      "thiếu suy nghĩ",
      "sợ thay đổi",
      "ngây thơ quá mức"
    ],
    "keywords": [
      "khởi đầu mới",
      "tự do",
      "ngây thơ",
      "phiêu lưu",
      "tự phát",
      "niềm tin"
    ],
    "psychologySummary": "Một chương mới đang mở ra và bạn không cần biết hết đường đi mới dám bước vào.",
    "careerFinance": "Một hướng đi mới trong công việc đang mời gọi bạn bước tới dù kế hoạch chưa hoàn chỉnh.",
    "loveRelationship": "Bạn đang mở lòng cho một kết nối mới mà không cần biết trước nó sẽ dẫn tới đâu.",
    "ventusAdvice": "Có một cảm giác chuyển động đang hiện diện trong cuộc sống của bạn lúc này, dù nó chưa rõ hình dạng cụ thể. Có thể đó là một quyết định bạn đang cân nhắc, một thay đổi hoàn cảnh sắp diễn ra, hay đơn giản là một cảm giác bên trong rằng đã đến lúc làm điều gì đó khác đi.",
    "quote": "Một chương mới đang mở ra và bạn không cần biết hết đường đi mới dám bước vào."
  },
  {
    "id": "the-magician",
    "number": 1,
    "name": "The Magician",
    "nameVi": "Pháp Sư",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-magician.jpg",
    "image": "/cards/the-magician.jpg",
    "image_filename": "the-magician.jpg",
    "uprightKeywords": [
      "sáng tạo",
      "ý chí",
      "kỹ năng",
      "hành động",
      "tự tin",
      "biểu hiện bản thân"
    ],
    "reversedKeywords": [
      "thao túng",
      "lừa dối",
      "tiềm năng chưa khai thác",
      "thiếu kế hoạch",
      "ảo tưởng"
    ],
    "keywords": [
      "sáng tạo",
      "ý chí",
      "kỹ năng",
      "hành động",
      "tự tin",
      "biểu hiện bản thân"
    ],
    "psychologySummary": "Bạn đang có đủ công cụ cần thiết trong tay, điều còn lại là chủ động dùng chúng.",
    "careerFinance": "Bạn đang có đủ kỹ năng và công cụ cần thiết để biến một ý tưởng thành kết quả cụ thể.",
    "loveRelationship": "Bạn có đủ khả năng để chủ động tạo ra kết nối bạn thật sự mong muốn, thay vì chờ đợi nó tự đến.",
    "ventusAdvice": "Nhìn tổng thể cuộc sống lúc này, có một cảm giác rằng mọi công cụ cần thiết đã có sẵn trong tay bạn, kỹ năng, mối quan hệ, thời gian, hoặc chỉ đơn giản là sự rõ ràng về điều mình muốn hướng tới.",
    "quote": "Bạn đang có đủ công cụ cần thiết trong tay, điều còn lại là chủ động dùng chúng."
  },
  {
    "id": "the-high-priestess",
    "number": 2,
    "name": "The High Priestess",
    "nameVi": "Nữ Tư Tế",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-high-priestess.jpg",
    "image": "/cards/the-high-priestess.jpg",
    "image_filename": "the-high-priestess.jpg",
    "uprightKeywords": [
      "trực giác",
      "bí ẩn",
      "tiềm thức",
      "tri thức nội tâm",
      "im lặng"
    ],
    "reversedKeywords": [
      "bí mật bị che giấu",
      "mất kết nối trực giác",
      "hời hợt",
      "rối loạn nội tâm"
    ],
    "keywords": [
      "trực giác",
      "bí ẩn",
      "tiềm thức",
      "tri thức nội tâm",
      "im lặng"
    ],
    "psychologySummary": "Đây là giai đoạn quan sát nội tâm, không phải mọi câu trả lời đều cần được nói ra ngay.",
    "careerFinance": "Một linh cảm nghề nghiệp đang đáng được lắng nghe, ngay cả khi chưa lý giải được bằng lời.",
    "loveRelationship": "Hãy lắng nghe cảm nhận bên trong về một người hay một mối quan hệ, chưa cần vội kết luận.",
    "ventusAdvice": "Nhìn tổng thể cuộc sống lúc này, có một chất lượng lặng lẽ và hướng nội đang hiện diện, như thể bạn đang ở trong một giai đoạn chuẩn bị âm thầm hơn là hành động ồn ào ra bên ngoài.",
    "quote": "Đây là giai đoạn quan sát nội tâm, không phải mọi câu trả lời đều cần được nói ra ngay."
  },
  {
    "id": "the-empress",
    "number": 3,
    "name": "The Empress",
    "nameVi": "Nữ Hoàng",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-empress.jpg",
    "image": "/cards/the-empress.jpg",
    "image_filename": "the-empress.jpg",
    "uprightKeywords": [
      "sung túc",
      "nuôi dưỡng",
      "sáng tạo",
      "thiên nhiên",
      "phong phú",
      "nữ tính"
    ],
    "reversedKeywords": [
      "phụ thuộc",
      "trì trệ sáng tạo",
      "mất cân bằng",
      "bảo bọc quá mức"
    ],
    "keywords": [
      "sung túc",
      "nuôi dưỡng",
      "sáng tạo",
      "thiên nhiên",
      "phong phú",
      "nữ tính"
    ],
    "psychologySummary": "Giai đoạn này mang năng lượng của sự phát triển tự nhiên, nơi mọi thứ đang lớn lên đúng nhịp nếu bạn kiên nhẫn chăm sóc nó.",
    "careerFinance": "Công việc của bạn đang mở ra không gian để bạn tạo ra giá trị theo cách riêng, không cần rập khuôn theo lối cũ.",
    "loveRelationship": "Tình cảm của bạn đang có không gian để lớn lên tự nhiên, không cần ép buộc hay gồng mình để chứng minh điều gì.",
    "ventusAdvice": "Giai đoạn này của bạn mang năng lượng của sự phát triển tự nhiên, giống như một mùa mà mọi thứ đang lớn lên đúng nhịp của nó, không cần bạn phải can thiệp quá nhiều.",
    "quote": "Giai đoạn này mang năng lượng của sự phát triển tự nhiên, nơi mọi thứ đang lớn lên đúng nhịp nếu bạn kiên nhẫn chăm sóc nó."
  },
  {
    "id": "the-emperor",
    "number": 4,
    "name": "The Emperor",
    "nameVi": "Hoàng Đế",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-emperor.jpg",
    "image": "/cards/the-emperor.jpg",
    "image_filename": "the-emperor.jpg",
    "uprightKeywords": [
      "quyền lực",
      "cấu trúc",
      "kỷ luật",
      "ổn định",
      "quyền uy",
      "bảo hộ"
    ],
    "reversedKeywords": [
      "độc đoán",
      "cứng nhắc",
      "mất kiểm soát",
      "lạm quyền"
    ],
    "keywords": [
      "quyền lực",
      "cấu trúc",
      "kỷ luật",
      "ổn định",
      "quyền uy",
      "bảo hộ"
    ],
    "psychologySummary": "Cuộc sống của bạn đang cần đến sự vững vàng và trật tự, đây là lúc đặt nền móng cho những gì bạn muốn xây dựng.",
    "careerFinance": "Đây là giai đoạn thuận lợi để bạn thể hiện khả năng tổ chức và dẫn dắt trong công việc bằng sự nhất quán.",
    "loveRelationship": "Mối quan hệ của bạn đang cần đến sự rõ ràng và ổn định, một nền tảng vững chắc cả hai cùng xây dựng.",
    "ventusAdvice": "Đây là giai đoạn cuộc sống của bạn có xu hướng cần đến sự vững vàng và trật tự nhiều hơn là những thay đổi bất ngờ. Bạn có thể đang cảm nhận được một nhu cầu bên trong muốn sắp xếp lại mọi thứ, công việc, tài chính, các mối quan hệ, hay đơn giản là thói quen sinh hoạt hằng ngày, theo một cấu trúc rõ ràng và bền vững hơn.",
    "quote": "Cuộc sống của bạn đang cần đến sự vững vàng và trật tự, đây là lúc đặt nền móng cho những gì bạn muốn xây dựng."
  },
  {
    "id": "the-hierophant",
    "number": 5,
    "name": "The Hierophant",
    "nameVi": "Giáo Hoàng",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-hierophant.jpg",
    "image": "/cards/the-hierophant.jpg",
    "image_filename": "the-hierophant.jpg",
    "uprightKeywords": [
      "truyền thống",
      "tâm linh",
      "giáo dục",
      "quy tắc",
      "cố vấn",
      "niềm tin"
    ],
    "reversedKeywords": [
      "nổi loạn",
      "phá cách",
      "giáo điều",
      "tư duy hẹp hòi"
    ],
    "keywords": [
      "truyền thống",
      "tâm linh",
      "giáo dục",
      "quy tắc",
      "cố vấn",
      "niềm tin"
    ],
    "psychologySummary": "Cuộc sống đang mời gọi bạn kết nối lại với giá trị nền tảng và tìm đến sự hướng dẫn từ người có kinh nghiệm hơn.",
    "careerFinance": "Đây là lúc học hỏi từ người đi trước và tôn trọng quy trình sẵn có, thay vì tự mày mò một mình.",
    "loveRelationship": "Mối quan hệ của bạn đang hướng về những giá trị nền tảng, sự cam kết chung hơn là cảm xúc thoáng qua.",
    "ventusAdvice": "Giai đoạn này của cuộc sống có thể đang mời gọi bạn kết nối lại với những giá trị nền tảng, điều gì thực sự quan trọng với bạn, những nguyên tắc bạn muốn sống theo, hoặc cộng đồng và truyền thống mà bạn thuộc về.",
    "quote": "Cuộc sống đang mời gọi bạn kết nối lại với giá trị nền tảng và tìm đến sự hướng dẫn từ người có kinh nghiệm hơn."
  },
  {
    "id": "the-lovers",
    "number": 6,
    "name": "The Lovers",
    "nameVi": "Tình Nhân",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-lovers.jpg",
    "image": "/cards/the-lovers.jpg",
    "image_filename": "the-lovers.jpg",
    "uprightKeywords": [
      "tình yêu",
      "hài hòa",
      "lựa chọn",
      "kết nối",
      "giá trị chung"
    ],
    "reversedKeywords": [
      "mất cân bằng",
      "lựa chọn sai lầm",
      "bất hòa",
      "xung đột giá trị"
    ],
    "keywords": [
      "tình yêu",
      "hài hòa",
      "lựa chọn",
      "kết nối",
      "giá trị chung"
    ],
    "psychologySummary": "Tình Nhân xuôi nói chung nhắc bạn về những kết nối và lựa chọn đang cần được nhìn thẳng, ở bất kỳ khía cạnh nào của cuộc sống đang cần sự đồng điệu.",
    "careerFinance": "Tình Nhân xuôi trong công việc nói về một sự cộng tác ăn ý, nơi bạn được là chính mình và công việc phản chiếu đúng những gì bạn thật sự coi trọng.",
    "loveRelationship": "Tình Nhân xuôi nói về một kết nối đang thật sự cùng nhìn về một hướng, nơi lựa chọn đến từ sự thấu hiểu chứ không phải chỉ là cảm xúc nhất thời.",
    "ventusAdvice": "Ở lớp tổng quát, lá này nói về những khoảnh khắc bạn được mời gọi chọn điều gì đó thật sự phù hợp với mình, thay vì điều dễ dàng hay quen thuộc. Có thể đó là một mối quan hệ, một công việc, một nhóm bạn, hoặc thậm chí là cách bạn phân bổ thời gian mỗi ngày.",
    "quote": "Tình Nhân xuôi nói chung nhắc bạn về những kết nối và lựa chọn đang cần được nhìn thẳng, ở bất kỳ khía cạnh nào của cuộc sống đang cần sự đồng điệu."
  },
  {
    "id": "the-chariot",
    "number": 7,
    "name": "The Chariot",
    "nameVi": "Cỗ Xe",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-chariot.jpg",
    "image": "/cards/the-chariot.jpg",
    "image_filename": "the-chariot.jpg",
    "uprightKeywords": [
      "ý chí",
      "chiến thắng",
      "quyết tâm",
      "kiểm soát",
      "tiến về phía trước"
    ],
    "reversedKeywords": [
      "mất phương hướng",
      "thiếu kiểm soát",
      "hung hăng",
      "trì hoãn"
    ],
    "keywords": [
      "ý chí",
      "chiến thắng",
      "quyết tâm",
      "kiểm soát",
      "tiến về phía trước"
    ],
    "psychologySummary": "Cỗ Xe xuôi nói chung là năng lượng của việc chủ động tiến về phía trước bằng ý chí rõ ràng, sau một giai đoạn có thể đã cảm thấy trì trệ hoặc thiếu định hướng.",
    "careerFinance": "Cỗ Xe xuôi trong công việc nói về giai đoạn bạn có đủ quyết tâm và sự tập trung để đẩy một mục tiêu khó về đích, miễn là bạn giữ được hướng đi rõ ràng.",
    "loveRelationship": "Cỗ Xe xuôi trong tình yêu nói về việc chủ động dẫn dắt mối quan hệ tiến về phía trước bằng sự quyết tâm rõ ràng, thay vì để mọi thứ trôi theo quán tính.",
    "ventusAdvice": "Ở lớp tổng quát, lá này đánh dấu một giai đoạn bạn có đủ quyết tâm để đẩy mọi việc tiến lên, sau có thể là một thời gian cảm thấy giậm chân tại chỗ. Đây không phải năng lượng của sự may mắn tình cờ, mà là kết quả của việc bạn chủ động chọn hướng đi và dồn sức vào đó.",
    "quote": "Cỗ Xe xuôi nói chung là năng lượng của việc chủ động tiến về phía trước bằng ý chí rõ ràng, sau một giai đoạn có thể đã cảm thấy trì trệ hoặc thiếu định hướng."
  },
  {
    "id": "strength",
    "number": 8,
    "name": "Strength",
    "nameVi": "Sức Mạnh",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/strength.jpg",
    "image": "/cards/strength.jpg",
    "image_filename": "strength.jpg",
    "uprightKeywords": [
      "can đảm",
      "kiên nhẫn",
      "lòng trắc ẩn",
      "sức mạnh nội tâm",
      "kiểm soát bản năng"
    ],
    "reversedKeywords": [
      "nghi ngờ bản thân",
      "yếu đuối",
      "mất kiên nhẫn",
      "bốc đồng"
    ],
    "keywords": [
      "can đảm",
      "kiên nhẫn",
      "lòng trắc ẩn",
      "sức mạnh nội tâm",
      "kiểm soát bản năng"
    ],
    "psychologySummary": "Sức Mạnh xuôi nói chung nhắc bạn rằng sức mạnh thật sự thường yên tĩnh và kiên nhẫn, thể hiện qua cách bạn đối diện với khó khăn bằng sự vững vàng thay vì phản ứng dữ dội.",
    "careerFinance": "Sức Mạnh xuôi trong công việc nói về việc xử lý áp lực bằng sự bình tĩnh và kiên trì bền bỉ, thay vì phản ứng bốc đồng hay cố chứng minh bản thân bằng vũ lực.",
    "loveRelationship": "Sức Mạnh xuôi trong tình yêu nói về việc đối diện với những phần khó khăn của một mối quan hệ bằng sự dịu dàng và kiên nhẫn, thay vì ép buộc hay né tránh.",
    "ventusAdvice": "Ở lớp tổng quát, lá này nói về một loại sức mạnh không cần phô trương, thứ sức mạnh giúp bạn vẫn đứng vững khi mọi thứ xung quanh có phần hỗn loạn, không phải bằng cách chống lại bằng vũ lực mà bằng sự kiên định nhẹ nhàng.",
    "quote": "Sức Mạnh xuôi nói chung nhắc bạn rằng sức mạnh thật sự thường yên tĩnh và kiên nhẫn, thể hiện qua cách bạn đối diện với khó khăn bằng sự vững vàng thay vì phản ứng dữ dội."
  },
  {
    "id": "the-hermit",
    "number": 9,
    "name": "The Hermit",
    "nameVi": "Ẩn Sĩ",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-hermit.jpg",
    "image": "/cards/the-hermit.jpg",
    "image_filename": "the-hermit.jpg",
    "uprightKeywords": [
      "nội tâm",
      "tìm kiếm chân lý",
      "cô độc",
      "chiêm nghiệm",
      "dẫn dắt"
    ],
    "reversedKeywords": [
      "cô lập",
      "lạc lối",
      "từ chối giúp đỡ",
      "cô đơn quá mức"
    ],
    "keywords": [
      "nội tâm",
      "tìm kiếm chân lý",
      "cô độc",
      "chiêm nghiệm",
      "dẫn dắt"
    ],
    "psychologySummary": "Đây là thời điểm phù hợp để lùi lại khỏi những ồn ào bên ngoài và dành thời gian tìm lại phương hướng cho chính mình.",
    "careerFinance": "Trước khi quyết định bước tiếp theo trong công việc, bạn cần một khoảng lặng để nghe lại điều mình thực sự muốn, thay vì chạy theo kỳ vọng xung quanh.",
    "loveRelationship": "Đây là lúc bạn cần một khoảng lặng để hiểu rõ mình thực sự cần gì ở một mối quan hệ, trước khi tìm ai đó để lấp đầy nó.",
    "ventusAdvice": "Có những giai đoạn cuộc sống đòi hỏi hành động, và có những giai đoạn đòi hỏi sự im lặng để nhìn lại — dường như bạn đang ở giai đoạn thứ hai. Không cần vội vàng lấp đầy thời gian bằng các kế hoạch mới hay cố gắng chứng minh điều gì với ai, đây là lúc phù hợp để rút lui một chút khỏi nhịp sống thường ngày và dành không gian cho việc chiêm nghiệm.",
    "quote": "Đây là thời điểm phù hợp để lùi lại khỏi những ồn ào bên ngoài và dành thời gian tìm lại phương hướng cho chính mình."
  },
  {
    "id": "wheel-of-fortune",
    "number": 10,
    "name": "Wheel of Fortune",
    "nameVi": "Bánh Xe Số Mệnh",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/wheel-of-fortune.jpg",
    "image": "/cards/wheel-of-fortune.jpg",
    "image_filename": "wheel-of-fortune.jpg",
    "uprightKeywords": [
      "vận mệnh",
      "chu kỳ",
      "thay đổi",
      "cơ hội",
      "bước ngoặt"
    ],
    "reversedKeywords": [
      "vận rủi",
      "trì trệ",
      "mất kiểm soát",
      "phá vỡ chu kỳ"
    ],
    "keywords": [
      "vận mệnh",
      "chu kỳ",
      "thay đổi",
      "cơ hội",
      "bước ngoặt"
    ],
    "psychologySummary": "Cuộc sống của bạn đang bước vào một bước ngoặt tự nhiên, và cách bạn đón nhận nó quan trọng hơn việc cố kiểm soát mọi chi tiết.",
    "careerFinance": "Một cơ hội hoặc bước chuyển bất ngờ có thể đang xuất hiện trong công việc, và bạn không cần kiểm soát mọi chi tiết để tận dụng nó.",
    "loveRelationship": "Một bước ngoặt đang mở ra trong đời sống tình cảm của bạn, và điều quan trọng là sẵn sàng đón nhận thay vì cố kiểm soát nó.",
    "ventusAdvice": "Có một cảm giác chuyển động đang xuất hiện trong cuộc sống của bạn gần đây, như thể một chương đang khép lại để nhường chỗ cho một chương khác, dù bạn có thể chưa hình dung rõ nó sẽ trông như thế nào.",
    "quote": "Cuộc sống của bạn đang bước vào một bước ngoặt tự nhiên, và cách bạn đón nhận nó quan trọng hơn việc cố kiểm soát mọi chi tiết."
  },
  {
    "id": "justice",
    "number": 11,
    "name": "Justice",
    "nameVi": "Công Lý",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/justice.jpg",
    "image": "/cards/justice.jpg",
    "image_filename": "justice.jpg",
    "uprightKeywords": [
      "công bằng",
      "sự thật",
      "luật nhân quả",
      "trách nhiệm",
      "cân bằng"
    ],
    "reversedKeywords": [
      "bất công",
      "thiên vị",
      "trốn tránh trách nhiệm",
      "mất cân bằng"
    ],
    "keywords": [
      "công bằng",
      "sự thật",
      "luật nhân quả",
      "trách nhiệm",
      "cân bằng"
    ],
    "psychologySummary": "Đây là thời điểm để nhìn nhận cuộc sống của mình một cách công bằng và trung thực, chịu trách nhiệm cho phần thuộc về mình.",
    "careerFinance": "Một quyết định công bằng và dựa trên sự thật trong công việc, kể cả khi khó khăn, sẽ mang lại kết quả bền vững hơn là né tránh nó.",
    "loveRelationship": "Đây là lúc nhìn thẳng vào sự thật trong mối quan hệ của mình một cách công bằng, kể cả với phần trách nhiệm thuộc về bạn.",
    "ventusAdvice": "Có một lời mời gọi hướng đến sự công bằng và trung thực đang xuất hiện trong cuộc sống của bạn lúc này, dù nó có thể đến dưới nhiều hình thức khác nhau — một quyết định cần đưa ra dựa trên lý trí thay vì cảm tính, một tình huống cần được nhìn nhận từ nhiều góc độ trước khi kết luận, hoặc một phần trách nhiệm của chính mình cần được thừa nhận thay vì tiếp tục đổ lỗi cho hoàn cảnh.",
    "quote": "Đây là thời điểm để nhìn nhận cuộc sống của mình một cách công bằng và trung thực, chịu trách nhiệm cho phần thuộc về mình."
  },
  {
    "id": "the-hanged-man",
    "number": 12,
    "name": "The Hanged Man",
    "nameVi": "Kẻ Treo Ngược",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-hanged-man.jpg",
    "image": "/cards/the-hanged-man.jpg",
    "image_filename": "the-hanged-man.jpg",
    "uprightKeywords": [
      "hy sinh",
      "buông bỏ",
      "góc nhìn mới",
      "tạm dừng",
      "chờ đợi"
    ],
    "reversedKeywords": [
      "trì hoãn vô ích",
      "chống cự",
      "hy sinh vô nghĩa",
      "mắc kẹt"
    ],
    "keywords": [
      "hy sinh",
      "buông bỏ",
      "góc nhìn mới",
      "tạm dừng",
      "chờ đợi"
    ],
    "psychologySummary": "Một giai đoạn chững lại trong cuộc sống có thể là món quà để bạn nhìn mọi thứ theo cách khác, thay vì một trở ngại cần vượt qua nhanh.",
    "careerFinance": "Một giai đoạn chững lại trong công việc có thể là cơ hội để bạn nhìn lại hướng đi thay vì chỉ cắm đầu chạy theo tiến độ.",
    "loveRelationship": "Tạm dừng nhịp độ trong chuyện tình cảm không phải là bỏ cuộc mà là cách để bạn nhìn rõ hơn điều mình thực sự muốn.",
    "ventusAdvice": "Cuộc sống đôi khi đưa bạn vào một khoảng dừng mà bạn không hoàn toàn chọn nhưng cũng không hoàn toàn bị ép buộc, một trạng thái lơ lửng giữa việc tiếp tục và việc chờ đợi.",
    "quote": "Một giai đoạn chững lại trong cuộc sống có thể là món quà để bạn nhìn mọi thứ theo cách khác, thay vì một trở ngại cần vượt qua nhanh."
  },
  {
    "id": "death",
    "number": 13,
    "name": "Death",
    "nameVi": "Tử Thần",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/death.jpg",
    "image": "/cards/death.jpg",
    "image_filename": "death.jpg",
    "uprightKeywords": [
      "kết thúc",
      "chuyển hóa",
      "khởi đầu mới",
      "buông bỏ quá khứ"
    ],
    "reversedKeywords": [
      "sợ thay đổi",
      "trì trệ",
      "chống lại chuyển hóa",
      "mắc kẹt trong quá khứ"
    ],
    "keywords": [
      "kết thúc",
      "chuyển hóa",
      "khởi đầu mới",
      "buông bỏ quá khứ"
    ],
    "psychologySummary": "Một chương trong cuộc sống đang khép lại để nhường chỗ cho một khởi đầu mà bạn chưa thể hình dung hết ngay lúc này.",
    "careerFinance": "Một vai trò hay cách làm việc quen thuộc có thể đang đến hồi kết thúc, mở đường cho một hướng đi phù hợp hơn với con người bạn lúc này.",
    "loveRelationship": "Một chương trong đời sống tình cảm đang khép lại không phải để trừng phạt bạn, mà để mở đường cho một dạng kết nối phù hợp hơn.",
    "ventusAdvice": "Có những giai đoạn cuộc sống tự nhiên đi đến hồi kết, không phải vì có điều gì sai, mà vì chúng đã hoàn thành vai trò của mình trong hành trình của bạn.",
    "quote": "Một chương trong cuộc sống đang khép lại để nhường chỗ cho một khởi đầu mà bạn chưa thể hình dung hết ngay lúc này."
  },
  {
    "id": "temperance",
    "number": 14,
    "name": "Temperance",
    "nameVi": "Tiết Chế",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/temperance.jpg",
    "image": "/cards/temperance.jpg",
    "image_filename": "temperance.jpg",
    "uprightKeywords": [
      "cân bằng",
      "điều độ",
      "kiên nhẫn",
      "hòa hợp",
      "chữa lành"
    ],
    "reversedKeywords": [
      "mất cân bằng",
      "thái quá",
      "thiếu kiên nhẫn",
      "xung đột nội tâm"
    ],
    "keywords": [
      "cân bằng",
      "điều độ",
      "kiên nhẫn",
      "hòa hợp",
      "chữa lành"
    ],
    "psychologySummary": "Cuộc sống đang mời bạn tìm một nhịp điệu hài hòa hơn, nơi mọi phần của bạn được cân bằng thay vì bị hy sinh cho một mục tiêu duy nhất.",
    "careerFinance": "Tìm được nhịp làm việc bền vững, thay vì chạy hết tốc lực rồi kiệt sức, mới là điều giúp bạn đi xa trong sự nghiệp.",
    "loveRelationship": "Một mối quan hệ phát triển bền vững thường không đến từ những khoảnh khắc bùng nổ, mà từ sự điều chỉnh kiên nhẫn và hài hòa mỗi ngày.",
    "ventusAdvice": "Có một cảm giác cân bằng đang len lỏi vào cuộc sống của bạn lúc này, như thể sau một giai đoạn xáo trộn, mọi thứ đang dần tìm được nhịp điệu ổn định hơn.",
    "quote": "Cuộc sống đang mời bạn tìm một nhịp điệu hài hòa hơn, nơi mọi phần của bạn được cân bằng thay vì bị hy sinh cho một mục tiêu duy nhất."
  },
  {
    "id": "the-devil",
    "number": 15,
    "name": "The Devil",
    "nameVi": "Ác Quỷ",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-devil.jpg",
    "image": "/cards/the-devil.jpg",
    "image_filename": "the-devil.jpg",
    "uprightKeywords": [
      "ràng buộc",
      "cám dỗ",
      "ham muốn vật chất",
      "nô lệ cho thói quen"
    ],
    "reversedKeywords": [
      "giải thoát",
      "nhận thức",
      "phá bỏ xiềng xích",
      "vượt qua cám dỗ"
    ],
    "keywords": [
      "ràng buộc",
      "cám dỗ",
      "ham muốn vật chất",
      "nô lệ cho thói quen"
    ],
    "psychologySummary": "Mời bạn nhìn lại tổng thể cuộc sống hiện tại để tìm ra điều gì đang giữ bạn ở một chỗ dù bạn muốn tiến lên.",
    "careerFinance": "Một lời nhắc để bạn nhìn thẳng vào việc mình đang bám vào công việc vì nó còn phù hợp, hay chỉ vì rời đi có vẻ đáng sợ hơn.",
    "loveRelationship": "Lá này mời bạn nhìn thẳng vào một mối gắn bó có thể đang giữ bạn ở lại vì quen thuộc hơn là vì hạnh phúc thật sự.",
    "ventusAdvice": "Ở lớp tổng quát, lá này chỉ ra một điều gì đó trong cuộc sống hiện tại của bạn đang được duy trì nhiều hơn vì quen thuộc hơn là vì nó thực sự phục vụ bạn.",
    "quote": "Mời bạn nhìn lại tổng thể cuộc sống hiện tại để tìm ra điều gì đang giữ bạn ở một chỗ dù bạn muốn tiến lên."
  },
  {
    "id": "the-tower",
    "number": 16,
    "name": "The Tower",
    "nameVi": "Tòa Tháp",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-tower.jpg",
    "image": "/cards/the-tower.jpg",
    "image_filename": "the-tower.jpg",
    "uprightKeywords": [
      "biến động đột ngột",
      "sụp đổ",
      "tỉnh ngộ",
      "khủng hoảng",
      "thay đổi bất ngờ"
    ],
    "reversedKeywords": [
      "tránh né thảm họa",
      "sợ thay đổi",
      "khủng hoảng nội tâm",
      "sụp đổ trì hoãn"
    ],
    "keywords": [
      "biến động đột ngột",
      "sụp đổ",
      "tỉnh ngộ",
      "khủng hoảng",
      "thay đổi bất ngờ"
    ],
    "psychologySummary": "Về một biến động bất ngờ trong cuộc sống có thể đang phá vỡ điều gì đã không còn vững, mở ra cơ hội xây dựng lại theo cách vững vàng hơn.",
    "careerFinance": "Về một thay đổi bất ngờ trong công việc có thể đang phá vỡ một cấu trúc không còn phù hợp, mở đường cho một hướng đi thật hơn.",
    "loveRelationship": "Nói về một sự thật bất ngờ có thể vừa làm lung lay một điều bạn tin là vững chắc trong tình yêu, mở ra cơ hội xây lại trên nền thật hơn.",
    "ventusAdvice": "Ở lớp tổng quát, lá này thường xuất hiện vào những giai đoạn có một biến động đến bất ngờ, làm thay đổi một phần cuộc sống mà bạn từng nghĩ là ổn định.",
    "quote": "Về một biến động bất ngờ trong cuộc sống có thể đang phá vỡ điều gì đã không còn vững, mở ra cơ hội xây dựng lại theo cách vững vàng hơn."
  },
  {
    "id": "the-star",
    "number": 17,
    "name": "The Star",
    "nameVi": "Ngôi Sao",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-star.jpg",
    "image": "/cards/the-star.jpg",
    "image_filename": "the-star.jpg",
    "uprightKeywords": [
      "hy vọng",
      "niềm tin",
      "cảm hứng",
      "chữa lành",
      "thanh thản"
    ],
    "reversedKeywords": [
      "tuyệt vọng",
      "mất niềm tin",
      "thiếu tự tin",
      "ngắt kết nối"
    ],
    "keywords": [
      "hy vọng",
      "niềm tin",
      "cảm hứng",
      "chữa lành",
      "thanh thản"
    ],
    "psychologySummary": "Tổng quát về một giai đoạn nhẹ nhõm và hy vọng đang mở ra sau một thời gian khó khăn, mời bạn tin tưởng vào những bước tiếp theo.",
    "careerFinance": "Về một cảm hứng mới đang le lói trong công việc, mở ra hướng đi mà bạn có thể tin tưởng theo đuổi từng bước.",
    "loveRelationship": "Về một cảm giác nhẹ nhõm và tin tưởng đang trở lại trong tình yêu, sau một giai đoạn khó khăn.",
    "ventusAdvice": "Ở lớp tổng quát, lá này thường xuất hiện như một dấu hiệu cho thấy bạn đang bước vào một giai đoạn nhẹ nhõm hơn sau một thời gian khó khăn hoặc căng thẳng kéo dài.",
    "quote": "Tổng quát về một giai đoạn nhẹ nhõm và hy vọng đang mở ra sau một thời gian khó khăn, mời bạn tin tưởng vào những bước tiếp theo."
  },
  {
    "id": "the-moon",
    "number": 18,
    "name": "The Moon",
    "nameVi": "Mặt Trăng",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-moon.jpg",
    "image": "/cards/the-moon.jpg",
    "image_filename": "the-moon.jpg",
    "uprightKeywords": [
      "ảo giác",
      "sợ hãi tiềm thức",
      "trực giác",
      "mơ hồ",
      "bất an"
    ],
    "reversedKeywords": [
      "giải tỏa sợ hãi",
      "sáng tỏ",
      "vượt qua nhầm lẫn",
      "sự thật lộ diện"
    ],
    "keywords": [
      "ảo giác",
      "sợ hãi tiềm thức",
      "trực giác",
      "mơ hồ",
      "bất an"
    ],
    "psychologySummary": "Giai đoạn này của bạn mang màu sắc chưa rõ ràng, nơi trực giác và nỗi bất an cùng lên tiếng, và việc cần làm không phải là ép mọi thứ sáng tỏ ngay mà là học cách ở yên với sự chưa biết.",
    "careerFinance": "Định hướng công việc lúc này chưa rõ nét, và cảm giác bất an bạn đang mang có thể là tín hiệu đáng lắng nghe chứ không hẳn là báo động thật sự.",
    "loveRelationship": "Có điều gì đó trong chuyện tình cảm hiện tại vẫn còn mờ, và bạn đang cố đọc nó bằng cả trực giác lẫn nỗi lo cũ chưa được gọi tên.",
    "ventusAdvice": "Có những giai đoạn trong cuộc sống không đến với câu trả lời rõ ràng mà đến với nhiều câu hỏi hơn, và có vẻ như bạn đang ở trong một khoảng thời gian như vậy, nơi mọi thứ xung quanh lẫn bên trong đều mang một lớp sương mờ khó gọi tên chính xác.",
    "quote": "Giai đoạn này của bạn mang màu sắc chưa rõ ràng, nơi trực giác và nỗi bất an cùng lên tiếng, và việc cần làm không phải là ép mọi thứ sáng tỏ ngay mà là học cách ở yên với sự chưa biết."
  },
  {
    "id": "the-sun",
    "number": 19,
    "name": "The Sun",
    "nameVi": "Mặt Trời",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-sun.jpg",
    "image": "/cards/the-sun.jpg",
    "image_filename": "the-sun.jpg",
    "uprightKeywords": [
      "niềm vui",
      "thành công",
      "sức sống",
      "lạc quan",
      "rõ ràng"
    ],
    "reversedKeywords": [
      "bi quan tạm thời",
      "trì hoãn thành công",
      "thiếu nhiệt huyết",
      "u ám nội tâm"
    ],
    "keywords": [
      "niềm vui",
      "thành công",
      "sức sống",
      "lạc quan",
      "rõ ràng"
    ],
    "psychologySummary": "Cuộc sống lúc này có thể đang mở ra một giai đoạn tươi sáng và rõ ràng, nơi niềm vui đến một cách tự nhiên chứ không cần phải cố tìm kiếm.",
    "careerFinance": "Công việc lúc này có thể mang lại cho bạn cảm giác tự hào và rõ ràng hiếm có, nơi nỗ lực của bạn được nhìn thấy đúng như nó là.",
    "loveRelationship": "Có một nguồn ấm áp và chân thật đang chiếu sáng chuyện tình cảm của bạn lúc này, nơi niềm vui không cần phải diễn mà tự nhiên hiện diện.",
    "ventusAdvice": "Có thể gần đây bạn cảm nhận được một luồng năng lượng tích cực lan tỏa trong nhiều mặt của cuộc sống, không nhất thiết là một sự kiện lớn lao nào đó, mà thường là một tổng hòa của những điều nhỏ đang diễn ra suôn sẻ cùng lúc, khiến bạn cảm thấy lạc quan và tràn đầy sức sống hơn bình thường.",
    "quote": "Cuộc sống lúc này có thể đang mở ra một giai đoạn tươi sáng và rõ ràng, nơi niềm vui đến một cách tự nhiên chứ không cần phải cố tìm kiếm."
  },
  {
    "id": "judgement",
    "number": 20,
    "name": "Judgement",
    "nameVi": "Phán Xét",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/judgement.jpg",
    "image": "/cards/judgement.jpg",
    "image_filename": "judgement.jpg",
    "uprightKeywords": [
      "thức tỉnh",
      "tái sinh",
      "đánh giá lại",
      "gọi hồn",
      "tha thứ"
    ],
    "reversedKeywords": [
      "nghi ngờ bản thân",
      "trốn tránh phán xét",
      "thiếu tha thứ",
      "trì hoãn thức tỉnh"
    ],
    "keywords": [
      "thức tỉnh",
      "tái sinh",
      "đánh giá lại",
      "gọi hồn",
      "tha thứ"
    ],
    "psychologySummary": "Đây có thể là một thời điểm chuyển mình quan trọng, khi bạn được mời gọi nhìn lại toàn bộ hành trình đã qua và bước vào một chương mới với sự thấu hiểu sâu sắc hơn.",
    "careerFinance": "Có một lời gọi bên trong đang mời bạn nhìn lại con đường sự nghiệp của mình với sự trung thực hơn, và có thể đây là lúc để bắt đầu một chương mới.",
    "loveRelationship": "Có một lời gọi từ bên trong đang mời bạn nhìn lại mối quan hệ của mình bằng con mắt trưởng thành hơn, sẵn sàng tha thứ hoặc buông bỏ những gì đã cũ.",
    "ventusAdvice": "Có thể gần đây bạn cảm nhận được một sự thôi thúc rõ ràng phải đánh giá lại cuộc sống của mình theo một cách tổng thể hơn, nhìn lại những gì đã qua với một sự trung thực mà trước đây bạn chưa sẵn sàng đối diện.",
    "quote": "Đây có thể là một thời điểm chuyển mình quan trọng, khi bạn được mời gọi nhìn lại toàn bộ hành trình đã qua và bước vào một chương mới với sự thấu hiểu sâu sắc hơn."
  },
  {
    "id": "the-world",
    "number": 21,
    "name": "The World",
    "nameVi": "Thế Giới",
    "arcana": "major",
    "arcanaType": "major",
    "arcanaLabelVi": "Bộ Ẩn Chính",
    "imageUrl": "/cards/the-world.jpg",
    "image": "/cards/the-world.jpg",
    "image_filename": "the-world.jpg",
    "uprightKeywords": [
      "hoàn thành",
      "viên mãn",
      "hợp nhất",
      "thành tựu",
      "du hành"
    ],
    "reversedKeywords": [
      "dang dở",
      "thiếu trọn vẹn",
      "trì hoãn thành công",
      "tìm kiếm sự khép kín"
    ],
    "keywords": [
      "hoàn thành",
      "viên mãn",
      "hợp nhất",
      "thành tựu",
      "du hành"
    ],
    "psychologySummary": "Một chu kỳ quan trọng trong cuộc sống bạn đang khép lại theo cách trọn vẹn, mở đường cho một khởi đầu mới.",
    "careerFinance": "Một dự án hoặc giai đoạn công việc đang tiến tới điểm hoàn tất, ghi nhận xứng đáng cho công sức đã bỏ ra.",
    "loveRelationship": "Một chặng đường tình cảm đang khép lại tròn trịa, để lại cảm giác đủ đầy thay vì dang dở.",
    "ventusAdvice": "Bạn đang đứng ở điểm cuối của một hành trình đủ dài để nhìn lại và thấy nó có ý nghĩa, nơi những nỗ lực rải rác trong thời gian qua giờ đây gộp lại thành một kết quả có hình hài rõ ràng.",
    "quote": "Một chu kỳ quan trọng trong cuộc sống bạn đang khép lại theo cách trọn vẹn, mở đường cho một khởi đầu mới."
  },
  {
    "id": "ace-of-wands",
    "number": 1,
    "name": "Ace of Wands",
    "nameVi": "Át Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/ace-of-wands.jpg",
    "image": "/cards/ace-of-wands.jpg",
    "image_filename": "ace-of-wands.jpg",
    "uprightKeywords": [
      "khởi đầu mới",
      "cảm hứng",
      "tiềm năng sáng tạo",
      "nhiệt huyết",
      "cơ hội"
    ],
    "reversedKeywords": [
      "trì hoãn",
      "thiếu động lực",
      "cảm hứng lụi tàn",
      "kế hoạch đổ vỡ"
    ],
    "keywords": [
      "khởi đầu mới",
      "cảm hứng",
      "tiềm năng sáng tạo",
      "nhiệt huyết",
      "cơ hội"
    ],
    "psychologySummary": "Một khởi đầu mới đầy cảm hứng đang xuất hiện trong cuộc sống của bạn, mang theo nguồn năng lượng và cơ hội tươi mới.",
    "careerFinance": "Một cơ hội hoặc ý tưởng mới trong công việc đang mở ra, mang theo nguồn năng lượng và động lực tươi mới.",
    "loveRelationship": "Một tia hứng khởi mới đang nhen lên trong đời sống tình cảm của bạn, mang theo cảm giác tươi mới và tràn đầy khả năng.",
    "ventusAdvice": "Có một luồng năng lượng mới mẻ đang bước vào cuộc sống của bạn, mang cảm giác giống như một khởi đầu mà bạn có thể cảm nhận rõ ràng trước khi biết chính xác nó sẽ dẫn tới đâu.",
    "quote": "Một khởi đầu mới đầy cảm hứng đang xuất hiện trong cuộc sống của bạn, mang theo nguồn năng lượng và cơ hội tươi mới."
  },
  {
    "id": "two-of-wands",
    "number": 2,
    "name": "Two of Wands",
    "nameVi": "Hai Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/two-of-wands.jpg",
    "image": "/cards/two-of-wands.jpg",
    "image_filename": "two-of-wands.jpg",
    "uprightKeywords": [
      "lập kế hoạch",
      "tầm nhìn xa",
      "quyết định tương lai",
      "khám phá"
    ],
    "reversedKeywords": [
      "sợ thay đổi",
      "thiếu kế hoạch",
      "do dự",
      "tầm nhìn hạn hẹp"
    ],
    "keywords": [
      "lập kế hoạch",
      "tầm nhìn xa",
      "quyết định tương lai",
      "khám phá"
    ],
    "psychologySummary": "Bạn đang ở vị trí thuận lợi để nhìn xa và cân nhắc hướng đi cho tương lai, thay vì chỉ phản ứng theo từng ngày.",
    "careerFinance": "Bạn đang ở vị trí thuận lợi để hoạch định hướng đi dài hạn cho sự nghiệp, thay vì chỉ xử lý công việc trước mắt.",
    "loveRelationship": "Bạn đang đứng ở vị trí thuận lợi để nhìn xa hơn về hướng đi cho đời sống tình cảm của mình, thay vì chỉ phản ứng theo từng ngày.",
    "ventusAdvice": "Bạn đang đứng ở một điểm nhìn thuận lợi trong cuộc sống, nơi bạn đã đủ vững vàng với hiện tại để bắt đầu nghĩ xa hơn về hướng đi tiếp theo, thay vì chỉ xử lý mọi việc theo quán tính từng ngày.",
    "quote": "Bạn đang ở vị trí thuận lợi để nhìn xa và cân nhắc hướng đi cho tương lai, thay vì chỉ phản ứng theo từng ngày."
  },
  {
    "id": "three-of-wands",
    "number": 3,
    "name": "Three of Wands",
    "nameVi": "Ba Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/three-of-wands.jpg",
    "image": "/cards/three-of-wands.jpg",
    "image_filename": "three-of-wands.jpg",
    "uprightKeywords": [
      "mở rộng",
      "tầm nhìn",
      "chờ đợi kết quả",
      "hợp tác",
      "tiến triển"
    ],
    "reversedKeywords": [
      "trì hoãn",
      "trở ngại",
      "thiếu tầm nhìn",
      "kế hoạch thất bại"
    ],
    "keywords": [
      "mở rộng",
      "tầm nhìn",
      "chờ đợi kết quả",
      "hợp tác",
      "tiến triển"
    ],
    "psychologySummary": "Cuộc sống đang ở một điểm nhìn cho phép thấy rõ hơn hướng đi phía trước, dù kết quả cụ thể vẫn cần thời gian.",
    "careerFinance": "Công việc đang mở ra một chặng đường rộng hơn, nơi những nỗ lực trước đó bắt đầu chờ ngày ra trái.",
    "loveRelationship": "Tình cảm đang bước vào giai đoạn nhìn xa hơn, nơi cả hai cùng chờ những gì đã vun đắp bắt đầu đơm hoa.",
    "ventusAdvice": "Bạn đang ở một điểm nhìn cho phép thấy rõ hơn con đường phía trước, không phải toàn bộ chi tiết, nhưng đủ để cảm nhận hướng đi đang dần rõ ràng. Những nỗ lực bạn đã bỏ ra trong thời gian qua, dù nhỏ hay lớn, đang bắt đầu bước vào giai đoạn chờ kết quả, và điều quan trọng lúc này là giữ được sự kiên nhẫn thay vì hoài nghi quá sớm.",
    "quote": "Cuộc sống đang ở một điểm nhìn cho phép thấy rõ hơn hướng đi phía trước, dù kết quả cụ thể vẫn cần thời gian."
  },
  {
    "id": "four-of-wands",
    "number": 4,
    "name": "Four of Wands",
    "nameVi": "Bốn Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/four-of-wands.jpg",
    "image": "/cards/four-of-wands.jpg",
    "image_filename": "four-of-wands.jpg",
    "uprightKeywords": [
      "lễ kỷ niệm",
      "hòa hợp",
      "ổn định gia đình",
      "thành tựu"
    ],
    "reversedKeywords": [
      "bất hòa gia đình",
      "thiếu ổn định",
      "hoãn lễ kỷ niệm",
      "căng thẳng nội bộ"
    ],
    "keywords": [
      "lễ kỷ niệm",
      "hòa hợp",
      "ổn định gia đình",
      "thành tựu"
    ],
    "psychologySummary": "Cuộc sống đang bước vào một giai đoạn ổn định đáng để ăn mừng, dù cột mốc lớn hay nhỏ.",
    "careerFinance": "Bạn có thể đang đứng trước một cột mốc đáng ghi nhận trong công việc, và đây là lúc cho phép mình ăn mừng.",
    "loveRelationship": "Có một cảm giác ấm áp, ổn định đang hiện diện trong đời sống tình cảm, như một cột mốc đáng dừng lại ăn mừng.",
    "ventusAdvice": "Cuộc sống của bạn đang bước vào một giai đoạn ổn định và đáng để ăn mừng, dù đó là một cột mốc lớn hay chỉ đơn giản là cảm giác mọi thứ đang vào guồng sau một thời gian xáo trộn.",
    "quote": "Cuộc sống đang bước vào một giai đoạn ổn định đáng để ăn mừng, dù cột mốc lớn hay nhỏ."
  },
  {
    "id": "five-of-wands",
    "number": 5,
    "name": "Five of Wands",
    "nameVi": "Năm Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/five-of-wands.jpg",
    "image": "/cards/five-of-wands.jpg",
    "image_filename": "five-of-wands.jpg",
    "uprightKeywords": [
      "xung đột",
      "cạnh tranh",
      "bất đồng",
      "thử thách"
    ],
    "reversedKeywords": [
      "tránh xung đột",
      "hòa giải",
      "cạnh tranh nội bộ giảm",
      "thỏa hiệp"
    ],
    "keywords": [
      "xung đột",
      "cạnh tranh",
      "bất đồng",
      "thử thách"
    ],
    "psychologySummary": "Cuộc sống có thể đang có nhiều điểm ma sát hơn bình thường, một phép thử cho sự vững vàng của bạn.",
    "careerFinance": "Môi trường làm việc có thể đang sôi động vì nhiều ý kiến trái chiều, một thử thách cho khả năng giữ vững lập trường.",
    "loveRelationship": "Những va chạm gần đây trong tình cảm có thể là cách hai người khác biệt học cách hiểu nhau hơn.",
    "ventusAdvice": "Cuộc sống của bạn lúc này có thể đang có nhiều điểm ma sát hơn bình thường, bất đồng với người xung quanh, cảm giác phải cạnh tranh để giữ vị trí của mình, hoặc đơn giản là nhiều việc cùng lúc đòi hỏi sự chú ý theo những hướng khác nhau.",
    "quote": "Cuộc sống có thể đang có nhiều điểm ma sát hơn bình thường, một phép thử cho sự vững vàng của bạn."
  },
  {
    "id": "six-of-wands",
    "number": 6,
    "name": "Six of Wands",
    "nameVi": "Sáu Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/six-of-wands.jpg",
    "image": "/cards/six-of-wands.jpg",
    "image_filename": "six-of-wands.jpg",
    "uprightKeywords": [
      "chiến thắng",
      "công nhận",
      "tự tin",
      "thành công"
    ],
    "reversedKeywords": [
      "thất bại",
      "thiếu công nhận",
      "kiêu ngạo",
      "hoài nghi bản thân"
    ],
    "keywords": [
      "chiến thắng",
      "công nhận",
      "tự tin",
      "thành công"
    ],
    "psychologySummary": "Đây là giai đoạn thành quả của bạn được nhìn nhận rõ ràng, mang lại sự tự tin xứng đáng sau một chặng cố gắng.",
    "careerFinance": "Công sức bạn bỏ ra trong công việc đang bắt đầu được nhìn nhận rõ ràng, mở ra cơ hội tự tin bước tiếp.",
    "loveRelationship": "Nỗ lực bạn bỏ ra trong chuyện tình cảm đang được nhìn thấy và trân trọng, mang lại cảm giác tự tin tự nhiên.",
    "ventusAdvice": "Có những giai đoạn trong cuộc sống mọi nỗ lực dường như trôi qua trong im lặng, và rồi đến một thời điểm mọi thứ bắt đầu được nhìn thấy cùng lúc, như thể cả thế giới xung quanh cuối cùng cũng bắt kịp những gì bạn đã âm thầm làm.",
    "quote": "Đây là giai đoạn thành quả của bạn được nhìn nhận rõ ràng, mang lại sự tự tin xứng đáng sau một chặng cố gắng."
  },
  {
    "id": "seven-of-wands",
    "number": 7,
    "name": "Seven of Wands",
    "nameVi": "Bảy Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/seven-of-wands.jpg",
    "image": "/cards/seven-of-wands.jpg",
    "image_filename": "seven-of-wands.jpg",
    "uprightKeywords": [
      "phòng thủ",
      "kiên định",
      "đối mặt thử thách",
      "bảo vệ lập trường"
    ],
    "reversedKeywords": [
      "kiệt sức",
      "bỏ cuộc",
      "áp lực quá lớn",
      "mất tự tin"
    ],
    "keywords": [
      "phòng thủ",
      "kiên định",
      "đối mặt thử thách",
      "bảo vệ lập trường"
    ],
    "psychologySummary": "Bạn đang trong giai đoạn cần đứng vững để bảo vệ điều mình tin là đúng, dù xung quanh có nhiều áp lực hoặc ý kiến trái chiều.",
    "careerFinance": "Bạn có thể đang phải bảo vệ vị trí, ý tưởng hoặc thành quả của mình trước sự cạnh tranh hoặc hoài nghi từ người khác.",
    "loveRelationship": "Bạn đang cần giữ vững điều mình tin là đúng trong mối quan hệ, ngay cả khi có áp lực từ bên ngoài hoặc từ chính người kia.",
    "ventusAdvice": "Có những giai đoạn cuộc sống đặt bạn vào vị trí phải bảo vệ một điều gì đó, có thể là một quyết định, một cách sống, một mối quan hệ, hay đơn giản là quyền được làm theo cách của riêng mình, trong khi xung quanh có nhiều tiếng nói khác đang cố gắng kéo bạn theo hướng khác.",
    "quote": "Bạn đang trong giai đoạn cần đứng vững để bảo vệ điều mình tin là đúng, dù xung quanh có nhiều áp lực hoặc ý kiến trái chiều."
  },
  {
    "id": "eight-of-wands",
    "number": 8,
    "name": "Eight of Wands",
    "nameVi": "Tám Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/eight-of-wands.jpg",
    "image": "/cards/eight-of-wands.jpg",
    "image_filename": "eight-of-wands.jpg",
    "uprightKeywords": [
      "tốc độ",
      "hành động nhanh",
      "tiến triển",
      "tin tức đến nhanh"
    ],
    "reversedKeywords": [
      "trì hoãn",
      "chậm trễ",
      "thất vọng",
      "mất kiểm soát tốc độ"
    ],
    "keywords": [
      "tốc độ",
      "hành động nhanh",
      "tiến triển",
      "tin tức đến nhanh"
    ],
    "psychologySummary": "Cuộc sống của bạn có thể đang bước vào giai đoạn chuyển động nhanh, với nhiều tiến triển và tin tức đến dồn dập.",
    "careerFinance": "Công việc của bạn có thể đang bước vào giai đoạn chuyển động nhanh, với nhiều việc cần xử lý và cơ hội đến dồn dập.",
    "loveRelationship": "Mọi thứ trong chuyện tình cảm có thể đang chuyển động nhanh hơn bình thường, mang lại cảm giác hào hứng và những bước tiến rõ rệt.",
    "ventusAdvice": "Có một nhịp độ khác thường đang xuất hiện trong nhiều mặt của cuộc sống bạn, những việc từng dậm chân tại chỗ giờ bắt đầu chuyển động, tin tức đến nhanh hơn, và những quyết định bạn đã cân nhắc lâu giờ có cơ hội được thực hiện.",
    "quote": "Cuộc sống của bạn có thể đang bước vào giai đoạn chuyển động nhanh, với nhiều tiến triển và tin tức đến dồn dập."
  },
  {
    "id": "nine-of-wands",
    "number": 9,
    "name": "Nine of Wands",
    "nameVi": "Chín Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/nine-of-wands.jpg",
    "image": "/cards/nine-of-wands.jpg",
    "image_filename": "nine-of-wands.jpg",
    "uprightKeywords": [
      "kiên cường",
      "cảnh giác",
      "bền bỉ",
      "gần đích"
    ],
    "reversedKeywords": [
      "kiệt sức",
      "hoang tưởng",
      "phòng thủ quá mức",
      "muốn bỏ cuộc"
    ],
    "keywords": [
      "kiên cường",
      "cảnh giác",
      "bền bỉ",
      "gần đích"
    ],
    "psychologySummary": "Bạn đang đứng ở một chặng gần cuối của một hành trình bền bỉ, và điều cần cân nhắc là liệu sự cảnh giác đã giúp bạn đi qua chặng đường ấy có còn cần thiết ở bước tiếp theo.",
    "careerFinance": "Bạn đã trụ vững qua giai đoạn khó khăn ở công việc và đang ở gần vạch đích hơn bạn nghĩ, dù sự mệt mỏi khiến mọi thứ có vẻ còn xa vời.",
    "loveRelationship": "Bạn đã giữ vững tình cảm qua nhiều thử thách, và điều cần làm bây giờ là phân biệt sự thận trọng đã tôi luyện với nỗi sợ mất thêm lần nữa.",
    "ventusAdvice": "Nhìn lại quãng thời gian vừa qua, có lẽ bạn sẽ nhận ra mình đã đi được xa hơn những gì cảm giác mệt mỏi hiện tại cho phép bạn thừa nhận. Bạn đã đối mặt với không ít thử thách, và thay vì bỏ cuộc giữa chừng, bạn chọn tiếp tục — đó là một dạng sức bền đáng được nhìn nhận một cách nghiêm túc, không phải điều gì hiển nhiên phải có.",
    "quote": "Bạn đang đứng ở một chặng gần cuối của một hành trình bền bỉ, và điều cần cân nhắc là liệu sự cảnh giác đã giúp bạn đi qua chặng đường ấy có còn cần thiết ở bước tiếp theo."
  },
  {
    "id": "ten-of-wands",
    "number": 10,
    "name": "Ten of Wands",
    "nameVi": "Mười Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/ten-of-wands.jpg",
    "image": "/cards/ten-of-wands.jpg",
    "image_filename": "ten-of-wands.jpg",
    "uprightKeywords": [
      "gánh nặng",
      "trách nhiệm",
      "quá tải",
      "áp lực"
    ],
    "reversedKeywords": [
      "buông bỏ gánh nặng",
      "ủy quyền",
      "kiệt sức",
      "giải thoát"
    ],
    "keywords": [
      "gánh nặng",
      "trách nhiệm",
      "quá tải",
      "áp lực"
    ],
    "psychologySummary": "Bạn đang mang trên vai nhiều hơn mức thường ngày, và điều đáng làm không phải là cố gồng thêm mà là nhìn lại xem phần nào thực sự cần bạn giữ.",
    "careerFinance": "Bạn đang mang trên vai nhiều trách nhiệm cùng lúc ở công việc, và việc gần chạm đến thành quả không có nghĩa bạn phải tiếp tục ôm hết mọi thứ một mình.",
    "loveRelationship": "Bạn có thể đang gánh phần lớn trách nhiệm cảm xúc trong mối quan hệ này, và đáng để nhìn lại xem đâu là phần thực sự của bạn, đâu là phần bạn tự nhận thêm.",
    "ventusAdvice": "Có những giai đoạn trong cuộc sống mà trách nhiệm dồn về cùng một lúc — không phải vì bạn làm gì sai, mà đơn giản là mọi thứ trùng thời điểm. Công việc, gia đình, các mối quan hệ, những dự định cá nhân, tất cả cùng đòi hỏi sự chú ý trong cùng một khoảng thời gian, và cảm giác quá tải xuất hiện như một phản ứng tự nhiên trước khối lượng đó, không phải dấu hiệu cho thấy bạn yếu đuối hay không đủ khả năng.",
    "quote": "Bạn đang mang trên vai nhiều hơn mức thường ngày, và điều đáng làm không phải là cố gồng thêm mà là nhìn lại xem phần nào thực sự cần bạn giữ."
  },
  {
    "id": "page-of-wands",
    "number": 11,
    "name": "Page of Wands",
    "nameVi": "Thị Đồng Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/page-of-wands.jpg",
    "image": "/cards/page-of-wands.jpg",
    "image_filename": "page-of-wands.jpg",
    "uprightKeywords": [
      "khám phá",
      "nhiệt huyết tuổi trẻ",
      "tin tức mới",
      "tinh thần phiêu lưu"
    ],
    "reversedKeywords": [
      "thiếu định hướng",
      "tin xấu",
      "trì hoãn",
      "bốc đồng"
    ],
    "keywords": [
      "khám phá",
      "nhiệt huyết tuổi trẻ",
      "tin tức mới",
      "tinh thần phiêu lưu"
    ],
    "psychologySummary": "Một tinh thần tò mò và hào hứng mới có thể đang bước vào cuộc sống của bạn, mời gọi bạn thử điều gì đó khác với lối mòn quen thuộc gần đây.",
    "careerFinance": "Một cơ hội hoặc ý tưởng mới mẻ có thể đang xuất hiện trong công việc của bạn, và đây là thời điểm tốt để thử nghiệm thay vì bám chặt vào cách làm quen thuộc.",
    "loveRelationship": "Một luồng năng lượng tò mò và hào hứng có thể đang bước vào chuyện tình cảm của bạn, mời gọi bạn thử điều gì đó mới thay vì đi theo lối mòn quen thuộc.",
    "ventusAdvice": "Có thể gần đây bạn cảm nhận được một luồng năng lượng mới trong cuộc sống — một sự háo hức muốn thử điều gì đó khác, một tin tức bất ngờ sắp đến, hoặc đơn giản là cảm giác sẵn sàng bước ra khỏi những gì đã quá quen thuộc.",
    "quote": "Một tinh thần tò mò và hào hứng mới có thể đang bước vào cuộc sống của bạn, mời gọi bạn thử điều gì đó khác với lối mòn quen thuộc gần đây."
  },
  {
    "id": "knight-of-wands",
    "number": 12,
    "name": "Knight of Wands",
    "nameVi": "Kỵ Sĩ Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/knight-of-wands.jpg",
    "image": "/cards/knight-of-wands.jpg",
    "image_filename": "knight-of-wands.jpg",
    "uprightKeywords": [
      "hành động",
      "đam mê",
      "phiêu lưu",
      "bốc đồng",
      "năng lượng"
    ],
    "reversedKeywords": [
      "hấp tấp",
      "thiếu kiên nhẫn",
      "thất thường",
      "kế hoạch bỏ dở"
    ],
    "keywords": [
      "hành động",
      "đam mê",
      "phiêu lưu",
      "bốc đồng",
      "năng lượng"
    ],
    "psychologySummary": "Đây là giai đoạn năng lượng sống dâng cao, thôi thúc bạn bước ra khỏi vùng quen thuộc để thử điều gì đó mới.",
    "careerFinance": "Bạn đang có động lực để nhảy vào một dự án hoặc cơ hội mới mà không chờ mọi thứ hoàn hảo.",
    "loveRelationship": "Một luồng nhiệt huyết mới đang đẩy bạn tiến nhanh hơn bình thường về phía người bạn thích, và điều đáng để ý là bạn có đang tiến cùng nhịp với họ không.",
    "ventusAdvice": "Có một luồng sinh khí đang chảy qua giai đoạn này của bạn, kiểu năng lượng khiến bạn muốn làm gì đó, đi đâu đó, thay đổi điều gì đó, thay vì tiếp tục ở yên trong nhịp sống cũ.",
    "quote": "Đây là giai đoạn năng lượng sống dâng cao, thôi thúc bạn bước ra khỏi vùng quen thuộc để thử điều gì đó mới."
  },
  {
    "id": "queen-of-wands",
    "number": 13,
    "name": "Queen of Wands",
    "nameVi": "Nữ Hoàng Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/queen-of-wands.jpg",
    "image": "/cards/queen-of-wands.jpg",
    "image_filename": "queen-of-wands.jpg",
    "uprightKeywords": [
      "tự tin",
      "quyến rũ",
      "độc lập",
      "năng động",
      "ấm áp"
    ],
    "reversedKeywords": [
      "ghen tuông",
      "đòi hỏi",
      "thiếu kiên nhẫn",
      "tự ti"
    ],
    "keywords": [
      "tự tin",
      "quyến rũ",
      "độc lập",
      "năng động",
      "ấm áp"
    ],
    "psychologySummary": "Đây là giai đoạn bạn toả sáng theo cách tự nhiên nhất, khi sự tự tin và ấm áp bên trong được thể hiện ra ngoài rõ ràng.",
    "careerFinance": "Sự tự tin và phong thái vững vàng của bạn đang khiến người khác trong công việc chú ý và tin tưởng hơn.",
    "loveRelationship": "Bạn đang toả ra một sức hút tự nhiên khiến người khác dễ bị thu hút bởi chính con người thật của bạn.",
    "ventusAdvice": "Có một phiên bản vững vàng và rạng rỡ của bạn đang được thể hiện rõ trong giai đoạn này, thứ khiến những người xung quanh cảm nhận được sự ấm áp và vững vàng từ bạn mà không cần bạn phải cố gắng chứng minh điều gì.",
    "quote": "Đây là giai đoạn bạn toả sáng theo cách tự nhiên nhất, khi sự tự tin và ấm áp bên trong được thể hiện ra ngoài rõ ràng."
  },
  {
    "id": "king-of-wands",
    "number": 14,
    "name": "King of Wands",
    "nameVi": "Vua Gậy",
    "arcana": "minor",
    "arcanaType": "wands",
    "arcanaLabelVi": "Bộ Gậy",
    "suit": "wands",
    "imageUrl": "/cards/king-of-wands.jpg",
    "image": "/cards/king-of-wands.jpg",
    "image_filename": "king-of-wands.jpg",
    "uprightKeywords": [
      "lãnh đạo",
      "tầm nhìn",
      "can đảm",
      "truyền cảm hứng"
    ],
    "reversedKeywords": [
      "độc đoán",
      "bốc đồng",
      "kỳ vọng cao",
      "nóng nảy"
    ],
    "keywords": [
      "lãnh đạo",
      "tầm nhìn",
      "can đảm",
      "truyền cảm hứng"
    ],
    "psychologySummary": "Đây là giai đoạn bạn có đủ tầm nhìn và can đảm để dẫn dắt cuộc sống của chính mình theo hướng bạn thật sự muốn.",
    "careerFinance": "Bạn đang có tầm nhìn và sự can đảm cần thiết để dẫn dắt một hướng đi lớn hơn trong công việc.",
    "loveRelationship": "Bạn đang có đủ sự vững vàng để dẫn dắt chuyện tình cảm của mình theo hướng bạn thật sự mong muốn.",
    "ventusAdvice": "Có một sự vững vàng đang lớn lên trong bạn lúc này, thứ cho phép bạn nhìn xa hơn những lo toan trước mắt và bắt đầu hình dung rõ ràng hơn về cuộc sống bạn muốn xây dựng cho chính mình.",
    "quote": "Đây là giai đoạn bạn có đủ tầm nhìn và can đảm để dẫn dắt cuộc sống của chính mình theo hướng bạn thật sự muốn."
  },
  {
    "id": "ace-of-cups",
    "number": 1,
    "name": "Ace of Cups",
    "nameVi": "Át Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/ace-of-cups.jpg",
    "image": "/cards/ace-of-cups.jpg",
    "image_filename": "ace-of-cups.jpg",
    "uprightKeywords": [
      "khởi đầu cảm xúc mới",
      "tình yêu",
      "trực giác",
      "lòng trắc ẩn"
    ],
    "reversedKeywords": [
      "cảm xúc kìm nén",
      "mất cân bằng cảm xúc",
      "tình yêu chưa trọn",
      "trống rỗng"
    ],
    "keywords": [
      "khởi đầu cảm xúc mới",
      "tình yêu",
      "trực giác",
      "lòng trắc ẩn"
    ],
    "psychologySummary": "Một khởi đầu cảm xúc mới đang mở ra trong cuộc sống của bạn, mời gọi bạn sống chậm lại và cảm nhận nhiều hơn.",
    "careerFinance": "Bạn đang bước vào một giai đoạn mà công việc có thể được nuôi dưỡng bằng sự tử tế và trực giác, không chỉ bằng nỗ lực thuần túy.",
    "loveRelationship": "Một cảm xúc mới đang mở ra trong bạn, đủ tươi để bạn tin lại vào khả năng yêu và được yêu.",
    "ventusAdvice": "Có một luồng năng lượng mới, tươi mát đang bước vào cuộc sống của bạn lúc này, giống như một cánh cửa cảm xúc vừa được mở ra sau một thời gian khép kín.",
    "quote": "Một khởi đầu cảm xúc mới đang mở ra trong cuộc sống của bạn, mời gọi bạn sống chậm lại và cảm nhận nhiều hơn."
  },
  {
    "id": "two-of-cups",
    "number": 2,
    "name": "Two of Cups",
    "nameVi": "Hai Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/two-of-cups.jpg",
    "image": "/cards/two-of-cups.jpg",
    "image_filename": "two-of-cups.jpg",
    "uprightKeywords": [
      "kết nối",
      "hợp tác",
      "tình yêu hài hòa",
      "thu hút lẫn nhau"
    ],
    "reversedKeywords": [
      "mất cân bằng trong mối quan hệ",
      "chia ly",
      "bất hòa",
      "thiếu tin tưởng"
    ],
    "keywords": [
      "kết nối",
      "hợp tác",
      "tình yêu hài hòa",
      "thu hút lẫn nhau"
    ],
    "psychologySummary": "Cuộc sống của bạn đang mở ra một sự kết nối cân bằng và chân thành, dù trong tình cảm, công việc hay tình bạn.",
    "careerFinance": "Một mối quan hệ hợp tác cân bằng và tôn trọng lẫn nhau đang có cơ hội hình thành trong công việc của bạn.",
    "loveRelationship": "Một sự kết nối chân thành và cân bằng đang có cơ hội hình thành hoặc được củng cố trong đời sống tình cảm của bạn.",
    "ventusAdvice": "Có một năng lượng kết nối đang xuất hiện trong cuộc sống của bạn lúc này, mang tính chất hai chiều và cân bằng, khác với những mối quan hệ mà bạn phải cố gắng một mình để duy trì.",
    "quote": "Cuộc sống của bạn đang mở ra một sự kết nối cân bằng và chân thành, dù trong tình cảm, công việc hay tình bạn."
  },
  {
    "id": "three-of-cups",
    "number": 3,
    "name": "Three of Cups",
    "nameVi": "Ba Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/three-of-cups.jpg",
    "image": "/cards/three-of-cups.jpg",
    "image_filename": "three-of-cups.jpg",
    "uprightKeywords": [
      "tình bạn",
      "ăn mừng",
      "cộng đồng",
      "niềm vui chung"
    ],
    "reversedKeywords": [
      "cô lập xã hội",
      "tiệc tùng thái quá",
      "mâu thuẫn bạn bè",
      "ganh tị"
    ],
    "keywords": [
      "tình bạn",
      "ăn mừng",
      "cộng đồng",
      "niềm vui chung"
    ],
    "psychologySummary": "Cuộc sống của bạn đang được nâng đỡ bởi niềm vui chung và sự gắn kết với cộng đồng xung quanh mình.",
    "careerFinance": "Sự gắn kết với đồng nghiệp và tinh thần đồng đội đang là nguồn năng lượng tích cực cho công việc của bạn lúc này.",
    "loveRelationship": "Niềm vui trong tình cảm của bạn có thể đang được nuôi dưỡng tốt nhất khi có sự góp mặt của bạn bè và cộng đồng xung quanh.",
    "ventusAdvice": "Có một tinh thần vui tươi và gắn kết đang xuất hiện trong cuộc sống của bạn lúc này, nhắc bạn nhớ rằng nhiều niềm vui ý nghĩa nhất không đến từ những thành tựu cá nhân đơn lẻ, mà từ những khoảnh khắc được chia sẻ cùng người khác.",
    "quote": "Cuộc sống của bạn đang được nâng đỡ bởi niềm vui chung và sự gắn kết với cộng đồng xung quanh mình."
  },
  {
    "id": "four-of-cups",
    "number": 4,
    "name": "Four of Cups",
    "nameVi": "Bốn Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/four-of-cups.jpg",
    "image": "/cards/four-of-cups.jpg",
    "image_filename": "four-of-cups.jpg",
    "uprightKeywords": [
      "thờ ơ",
      "trầm ngâm",
      "bỏ lỡ cơ hội",
      "chán nản"
    ],
    "reversedKeywords": [
      "tỉnh thức",
      "đón nhận cơ hội mới",
      "thoát khỏi trì trệ",
      "khơi lại động lực"
    ],
    "keywords": [
      "thờ ơ",
      "trầm ngâm",
      "bỏ lỡ cơ hội",
      "chán nản"
    ],
    "psychologySummary": "Một điều gì đó đáng để đón nhận đang ở rất gần, nhưng sự chán nản hiện tại đang che mờ khả năng nhận ra nó.",
    "careerFinance": "Một đề nghị hay hướng đi mới có thể đang nằm ngay trong tầm tay, nhưng sự chán nản với công việc hiện tại đang khiến bạn nhìn nó bằng ánh mắt hờ hững.",
    "loveRelationship": "Một cơ hội tình cảm đang ở ngay trước mắt, nhưng sự chán chường bên trong đang khiến bạn không buồn ngẩng lên nhìn nó.",
    "ventusAdvice": "Bạn đang ở trong một giai đoạn mà mọi thứ có vẻ nhạt nhòa hơn bình thường, không hẳn là tệ, chỉ là thiếu đi sự hào hứng từng có. Đây là trạng thái rất con người, khi tâm trí cần thời gian để tiêu hóa những gì đã trải qua trước khi sẵn sàng đón nhận điều tiếp theo.",
    "quote": "Một điều gì đó đáng để đón nhận đang ở rất gần, nhưng sự chán nản hiện tại đang che mờ khả năng nhận ra nó."
  },
  {
    "id": "five-of-cups",
    "number": 5,
    "name": "Five of Cups",
    "nameVi": "Năm Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/five-of-cups.jpg",
    "image": "/cards/five-of-cups.jpg",
    "image_filename": "five-of-cups.jpg",
    "uprightKeywords": [
      "mất mát",
      "tiếc nuối",
      "đau buồn",
      "thất vọng"
    ],
    "reversedKeywords": [
      "chấp nhận",
      "tha thứ",
      "tìm lại hy vọng",
      "chữa lành"
    ],
    "keywords": [
      "mất mát",
      "tiếc nuối",
      "đau buồn",
      "thất vọng"
    ],
    "psychologySummary": "Bạn đang trải qua một giai đoạn buồn bã vì điều gì đó đã mất, nhưng vẫn còn những phần nguyên vẹn trong cuộc sống mà nỗi tiếc nuối đang che khuất.",
    "careerFinance": "Một thất vọng trong công việc đang khiến bạn chỉ nhìn thấy những gì không thành, trong khi vẫn còn những nguồn lực khác chưa được để ý.",
    "loveRelationship": "Bạn đang đau vì một mất mát tình cảm thật sự, nhưng vẫn còn những điều nguyên vẹn ở gần mà nỗi buồn đang khiến bạn chưa nhìn thấy.",
    "ventusAdvice": "Có một cảm giác mất mát đang bao trùm lên bạn lúc này, có thể liên quan đến một mối quan hệ, một kế hoạch, hoặc một phần bản thân mà bạn từng gắn bó. Sự thất vọng này là thật, và nó xứng đáng được thừa nhận thay vì bị vội vàng gạt sang một bên để tỏ ra mạnh mẽ.",
    "quote": "Bạn đang trải qua một giai đoạn buồn bã vì điều gì đó đã mất, nhưng vẫn còn những phần nguyên vẹn trong cuộc sống mà nỗi tiếc nuối đang che khuất."
  },
  {
    "id": "six-of-cups",
    "number": 6,
    "name": "Six of Cups",
    "nameVi": "Sáu Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/six-of-cups.jpg",
    "image": "/cards/six-of-cups.jpg",
    "image_filename": "six-of-cups.jpg",
    "uprightKeywords": [
      "hoài niệm",
      "ký ức tuổi thơ",
      "ngây thơ",
      "tái ngộ"
    ],
    "reversedKeywords": [
      "mắc kẹt trong quá khứ",
      "thiếu thực tế",
      "khao khát hoài niệm",
      "trốn tránh hiện tại"
    ],
    "keywords": [
      "hoài niệm",
      "ký ức tuổi thơ",
      "ngây thơ",
      "tái ngộ"
    ],
    "psychologySummary": "Một điều gì đó từ quá khứ đang nhẹ nhàng quay lại trong cuộc sống của bạn, mang theo sự ấm áp và cảm giác quen thuộc dễ chịu.",
    "careerFinance": "Một cơ hội hoặc mối liên hệ từ quá khứ nghề nghiệp đang quay lại, mang theo cảm giác quen thuộc và dễ chịu.",
    "loveRelationship": "Một cảm giác ấm áp từ quá khứ đang quay lại trong đời sống tình cảm của bạn, gợi nhắc về sự chân thành đơn giản từng có.",
    "ventusAdvice": "Có một luồng năng lượng hoài niệm đang xuất hiện trong cuộc sống của bạn, có thể qua một người, một địa điểm, một kỷ niệm chợt ùa về, hoặc đơn giản là một cảm giác mơ hồ về sự đơn giản và an toàn của những ngày đã qua.",
    "quote": "Một điều gì đó từ quá khứ đang nhẹ nhàng quay lại trong cuộc sống của bạn, mang theo sự ấm áp và cảm giác quen thuộc dễ chịu."
  },
  {
    "id": "seven-of-cups",
    "number": 7,
    "name": "Seven of Cups",
    "nameVi": "Bảy Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/seven-of-cups.jpg",
    "image": "/cards/seven-of-cups.jpg",
    "image_filename": "seven-of-cups.jpg",
    "uprightKeywords": [
      "ảo tưởng",
      "nhiều lựa chọn",
      "mơ mộng",
      "thiếu quyết đoán"
    ],
    "reversedKeywords": [
      "rõ ràng",
      "quyết đoán",
      "gạt bỏ ảo tưởng",
      "chọn đúng hướng"
    ],
    "keywords": [
      "ảo tưởng",
      "nhiều lựa chọn",
      "mơ mộng",
      "thiếu quyết đoán"
    ],
    "psychologySummary": "Tổng thể, lá này gợi ý bạn đang đứng giữa nhiều khả năng hấp dẫn mà chưa khả năng nào được bạn thật sự bước vào.",
    "careerFinance": "Trong công việc, lá này cho thấy bạn đang bị cuốn giữa nhiều hướng đi hấp dẫn mà chưa hướng nào được bạn thử nghiệm thật sự.",
    "loveRelationship": "Trong tình yêu, lá này gợi ý bạn đang đứng giữa nhiều hình dung khác nhau về một mối quan hệ mà chưa cái nào được kiểm chứng bằng thực tế.",
    "ventusAdvice": "Cuộc sống của bạn lúc này có thể đang mở ra nhiều hướng đi cùng lúc, mỗi hướng mang một hứa hẹn riêng, một phiên bản khác của bạn mà bạn có thể trở thành.",
    "quote": "Tổng thể, lá này gợi ý bạn đang đứng giữa nhiều khả năng hấp dẫn mà chưa khả năng nào được bạn thật sự bước vào."
  },
  {
    "id": "eight-of-cups",
    "number": 8,
    "name": "Eight of Cups",
    "nameVi": "Tám Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/eight-of-cups.jpg",
    "image": "/cards/eight-of-cups.jpg",
    "image_filename": "eight-of-cups.jpg",
    "uprightKeywords": [
      "từ bỏ",
      "tìm kiếm ý nghĩa sâu xa",
      "rời bỏ",
      "hành trình nội tâm"
    ],
    "reversedKeywords": [
      "sợ thay đổi",
      "ở lại dù không hạnh phúc",
      "do dự rời đi",
      "trốn tránh sự thật"
    ],
    "keywords": [
      "từ bỏ",
      "tìm kiếm ý nghĩa sâu xa",
      "rời bỏ",
      "hành trình nội tâm"
    ],
    "psychologySummary": "Tổng thể, lá này cho thấy bạn đang được mời gọi rời khỏi một điều quen thuộc để đi tìm một cuộc sống có ý nghĩa sâu sắc hơn với mình.",
    "careerFinance": "Trong công việc, lá này cho thấy bạn có thể đang cảm thấy chông chênh dù đã đạt được những gì từng đặt mục tiêu, và điều đó đáng để lắng nghe.",
    "loveRelationship": "Trong tình yêu, lá này gợi ý bạn đang cảm nhận một điều gì đó không còn đủ để lấp đầy mình, dù bên ngoài mọi thứ có thể vẫn ổn.",
    "ventusAdvice": "Có thể nhìn từ bên ngoài, cuộc sống của bạn không có gì đáng phàn nàn, bạn có những gì nhiều người mong muốn, một sự ổn định nhất định. Nhưng bên trong, bạn lại cảm thấy như mình đang sống một cuộc đời không hoàn toàn là của mình, như thể có một tiếng gọi âm thầm đang thúc giục bạn tìm kiếm điều gì đó chân thật hơn.",
    "quote": "Tổng thể, lá này cho thấy bạn đang được mời gọi rời khỏi một điều quen thuộc để đi tìm một cuộc sống có ý nghĩa sâu sắc hơn với mình."
  },
  {
    "id": "nine-of-cups",
    "number": 9,
    "name": "Nine of Cups",
    "nameVi": "Chín Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/nine-of-cups.jpg",
    "image": "/cards/nine-of-cups.jpg",
    "image_filename": "nine-of-cups.jpg",
    "uprightKeywords": [
      "mãn nguyện",
      "hạnh phúc",
      "ước nguyện thành hiện thực",
      "hài lòng"
    ],
    "reversedKeywords": [
      "thỏa mãn hời hợt",
      "tham lam",
      "bất mãn nội tâm",
      "kiêu ngạo"
    ],
    "keywords": [
      "mãn nguyện",
      "hạnh phúc",
      "ước nguyện thành hiện thực",
      "hài lòng"
    ],
    "psychologySummary": "Tổng thể, lá này cho thấy bạn đang ở một giai đoạn mà nhiều điều mình mong muốn đang dần thành hình, mang lại cảm giác hài lòng thật sự.",
    "careerFinance": "Trong công việc, lá này cho thấy những nỗ lực của bạn đang mang lại kết quả khiến bạn cảm thấy hài lòng và tự hào một cách chính đáng.",
    "loveRelationship": "Trong tình yêu, lá này cho thấy bạn đang ở gần với một cảm giác hài lòng thật sự, điều đáng được ghi nhận và tận hưởng trọn vẹn.",
    "ventusAdvice": "Có thể nhìn lại một chặng đường đã qua, bạn nhận ra mình đang có được nhiều điều mà trước đây từng mong ước, không nhất thiết là mọi thứ hoàn hảo, nhưng đủ để bạn cảm thấy cuộc sống của mình đang đi đúng hướng.",
    "quote": "Tổng thể, lá này cho thấy bạn đang ở một giai đoạn mà nhiều điều mình mong muốn đang dần thành hình, mang lại cảm giác hài lòng thật sự."
  },
  {
    "id": "ten-of-cups",
    "number": 10,
    "name": "Ten of Cups",
    "nameVi": "Mười Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/ten-of-cups.jpg",
    "image": "/cards/ten-of-cups.jpg",
    "image_filename": "ten-of-cups.jpg",
    "uprightKeywords": [
      "hạnh phúc gia đình",
      "viên mãn cảm xúc",
      "hòa hợp lâu dài",
      "gắn kết bền vững"
    ],
    "reversedKeywords": [
      "bất hòa gia đình",
      "giá trị lệch lạc",
      "hạnh phúc giả tạo",
      "kỳ vọng đổ vỡ"
    ],
    "keywords": [
      "hạnh phúc gia đình",
      "viên mãn cảm xúc",
      "hòa hợp lâu dài",
      "gắn kết bền vững"
    ],
    "psychologySummary": "Nhìn tổng thể, đây là giai đoạn mọi mảnh ghép trong đời sống của bạn đang dần khớp lại với nhau theo cách khiến bạn cảm thấy đủ đầy.",
    "careerFinance": "Ở khía cạnh sự nghiệp, lá này gợi ý một môi trường làm việc nơi bạn cảm thấy được tôn trọng và thuộc về, quan trọng không kém con số thành tích.",
    "loveRelationship": "Sự viên mãn trong tình cảm không nằm ở khoảnh khắc bùng nổ mà ở cảm giác được thuộc về nhau qua những điều bình thường mỗi ngày.",
    "ventusAdvice": "Khi lá này xuất hiện ở vị trí tổng quát, nó thường phản ánh một giai đoạn mà nhiều khía cạnh trong cuộc sống của bạn, không chỉ một mảng riêng lẻ, đang cùng lúc mang lại cảm giác ổn định và ấm áp.",
    "quote": "Nhìn tổng thể, đây là giai đoạn mọi mảnh ghép trong đời sống của bạn đang dần khớp lại với nhau theo cách khiến bạn cảm thấy đủ đầy."
  },
  {
    "id": "page-of-cups",
    "number": 11,
    "name": "Page of Cups",
    "nameVi": "Thị Đồng Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/page-of-cups.jpg",
    "image": "/cards/page-of-cups.jpg",
    "image_filename": "page-of-cups.jpg",
    "uprightKeywords": [
      "tin tức cảm xúc",
      "sáng tạo",
      "trực giác nhạy bén",
      "khởi đầu tình cảm"
    ],
    "reversedKeywords": [
      "bất ổn cảm xúc",
      "sáng tạo bị chặn",
      "tin tức thất vọng",
      "trẻ con"
    ],
    "keywords": [
      "tin tức cảm xúc",
      "sáng tạo",
      "trực giác nhạy bén",
      "khởi đầu tình cảm"
    ],
    "psychologySummary": "Nhìn tổng thể, đây là giai đoạn của những khởi đầu nhẹ nhàng và tin tức mới mẻ, mời gọi bạn tiếp cận cuộc sống với sự tò mò như một đứa trẻ.",
    "careerFinance": "Trong công việc, lá này gợi ý một cơ hội hoặc ý tưởng mới đang đến, đòi hỏi bạn giữ tinh thần cởi mở và tin vào trực giác nghề nghiệp của mình.",
    "loveRelationship": "Lá này báo hiệu một sự khởi đầu nhẹ nhàng trong đời sống tình cảm, có thể là một tin nhắn, một ánh mắt, một cảm xúc mới mẻ đáng để bạn đón nhận với sự cởi mở.",
    "ventusAdvice": "Có một điều gì đó mới mẻ đang bắt đầu trong đời sống của bạn lúc này, dù nó có thể chưa rõ hình hài, một mối quan hệ, một sở thích, một cơ hội, hoặc đơn giản là một cách nhìn khác về những gì quen thuộc.",
    "quote": "Nhìn tổng thể, đây là giai đoạn của những khởi đầu nhẹ nhàng và tin tức mới mẻ, mời gọi bạn tiếp cận cuộc sống với sự tò mò như một đứa trẻ."
  },
  {
    "id": "knight-of-cups",
    "number": 12,
    "name": "Knight of Cups",
    "nameVi": "Kỵ Sĩ Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/knight-of-cups.jpg",
    "image": "/cards/knight-of-cups.jpg",
    "image_filename": "knight-of-cups.jpg",
    "uprightKeywords": [
      "lãng mạn",
      "quyến rũ",
      "theo đuổi cảm xúc",
      "lý tưởng hóa"
    ],
    "reversedKeywords": [
      "ghen tuông",
      "thất vọng tình cảm",
      "lừa dối",
      "tâm trạng thất thường"
    ],
    "keywords": [
      "lãng mạn",
      "quyến rũ",
      "theo đuổi cảm xúc",
      "lý tưởng hóa"
    ],
    "psychologySummary": "Nhìn tổng thể, đây là giai đoạn tràn đầy cảm hứng và mong muốn theo đuổi điều gì đó đẹp đẽ, miễn là bạn giữ được sự tỉnh táo giữa mơ mộng và thực tế.",
    "careerFinance": "Trong công việc, lá này gợi ý một cách tiếp cận đầy nhiệt huyết và thuyết phục, hữu ích khi trình bày ý tưởng nhưng cần đi kèm hành động cụ thể để không chỉ dừng ở lời nói.",
    "loveRelationship": "Lá này mang năng lượng của một sự theo đuổi lãng mạn đầy cảm hứng, nhưng cũng nhắc bạn giữ một chút tỉnh táo giữa những lời ngọt ngào và hành động thực tế.",
    "ventusAdvice": "Có một nguồn năng lượng lãng mạn và đầy cảm hứng đang chảy qua cuộc sống của bạn lúc này, có thể là một mối quan hệ, một dự định, một giấc mơ về cách bạn muốn cuộc đời mình trông như thế nào.",
    "quote": "Nhìn tổng thể, đây là giai đoạn tràn đầy cảm hứng và mong muốn theo đuổi điều gì đó đẹp đẽ, miễn là bạn giữ được sự tỉnh táo giữa mơ mộng và thực tế."
  },
  {
    "id": "queen-of-cups",
    "number": 13,
    "name": "Queen of Cups",
    "nameVi": "Nữ Hoàng Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/queen-of-cups.jpg",
    "image": "/cards/queen-of-cups.jpg",
    "image_filename": "queen-of-cups.jpg",
    "uprightKeywords": [
      "trực giác sâu sắc",
      "lòng trắc ẩn",
      "thấu cảm",
      "điềm tĩnh"
    ],
    "reversedKeywords": [
      "cảm xúc bất ổn",
      "phụ thuộc cảm xúc",
      "tự thương hại",
      "u sầu"
    ],
    "keywords": [
      "trực giác sâu sắc",
      "lòng trắc ẩn",
      "thấu cảm",
      "điềm tĩnh"
    ],
    "psychologySummary": "Bạn đang ở trong một giai đoạn mà sự nhạy cảm và điềm tĩnh của bạn trở thành nơi nương tựa cho cả chính mình lẫn những người xung quanh.",
    "careerFinance": "Bạn làm việc tốt nhất khi được phép cảm nhận không khí xung quanh trước khi hành động, và điều đó đáng được tôn trọng như một kỹ năng thật sự.",
    "loveRelationship": "Bạn đang mang đến cho người thương một cảm giác được thấu hiểu và an toàn mà không cần phải cố gắng quá nhiều để chứng minh điều đó.",
    "ventusAdvice": "Có một sự cân bằng đang hình thành trong bạn lúc này, giữa việc cảm nhận sâu sắc mọi thứ xảy ra xung quanh và việc không để bản thân bị cuốn trôi theo những cảm xúc đó.",
    "quote": "Bạn đang ở trong một giai đoạn mà sự nhạy cảm và điềm tĩnh của bạn trở thành nơi nương tựa cho cả chính mình lẫn những người xung quanh."
  },
  {
    "id": "king-of-cups",
    "number": 14,
    "name": "King of Cups",
    "nameVi": "Vua Cốc",
    "arcana": "minor",
    "arcanaType": "cups",
    "arcanaLabelVi": "Bộ Cốc",
    "suit": "cups",
    "imageUrl": "/cards/king-of-cups.jpg",
    "image": "/cards/king-of-cups.jpg",
    "image_filename": "king-of-cups.jpg",
    "uprightKeywords": [
      "cân bằng cảm xúc",
      "khôn ngoan",
      "điềm đạm",
      "bao dung"
    ],
    "reversedKeywords": [
      "lạnh lùng",
      "thao túng cảm xúc",
      "bất ổn tâm lý",
      "vô tâm"
    ],
    "keywords": [
      "cân bằng cảm xúc",
      "khôn ngoan",
      "điềm đạm",
      "bao dung"
    ],
    "psychologySummary": "Bạn đang trở thành chỗ dựa vững vàng cho những người xung quanh nhờ khả năng giữ bình tĩnh và nhìn nhận mọi việc một cách bao dung.",
    "careerFinance": "Bạn đang được nhìn nhận như một điểm tựa đáng tin cậy ở nơi làm việc, người giữ được cái đầu lạnh ngay cả khi tình huống trở nên rối ren.",
    "loveRelationship": "Bạn đang mang đến sự ổn định cho mối quan hệ của mình bằng cách phản hồi thay vì phản ứng, ngay cả khi mọi thứ trở nên căng thẳng.",
    "ventusAdvice": "Có những người, khi có mặt trong phòng, tự nhiên khiến không khí bớt căng thẳng hơn — không phải vì họ nói nhiều, mà vì cách họ hiện diện toát ra sự ổn định.",
    "quote": "Bạn đang trở thành chỗ dựa vững vàng cho những người xung quanh nhờ khả năng giữ bình tĩnh và nhìn nhận mọi việc một cách bao dung."
  },
  {
    "id": "ace-of-swords",
    "number": 1,
    "name": "Ace of Swords",
    "nameVi": "Át Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/ace-of-swords.jpg",
    "image": "/cards/ace-of-swords.jpg",
    "image_filename": "ace-of-swords.jpg",
    "uprightKeywords": [
      "đột phá tư duy",
      "sự thật",
      "rõ ràng",
      "ý tưởng mới"
    ],
    "reversedKeywords": [
      "nhầm lẫn",
      "tư duy hỗn loạn",
      "sự thật bị bóp méo",
      "phán đoán sai"
    ],
    "keywords": [
      "đột phá tư duy",
      "sự thật",
      "rõ ràng",
      "ý tưởng mới"
    ],
    "psychologySummary": "Một sự rõ ràng bất ngờ đang xuất hiện trong cách bạn nhìn nhận một tình huống quan trọng, mở ra khả năng hành động dứt khoát hơn.",
    "careerFinance": "Một ý tưởng hoặc hướng đi mới đang trở nên rõ ràng với bạn trong công việc, mang theo cảm giác quyết đoán hiếm có gần đây.",
    "loveRelationship": "Một khoảnh khắc rõ ràng bất ngờ đang giúp bạn nhìn thấy điều mình thực sự cần trong tình cảm, thay vì tiếp tục đoán mò.",
    "ventusAdvice": "Có một luồng minh mẫn đang đến với bạn ở giai đoạn này, giống như khi màn sương buổi sáng bất chợt tan để lộ ra toàn bộ khung cảnh mà trước đó chỉ thấy lờ mờ từng mảng.",
    "quote": "Một sự rõ ràng bất ngờ đang xuất hiện trong cách bạn nhìn nhận một tình huống quan trọng, mở ra khả năng hành động dứt khoát hơn."
  },
  {
    "id": "two-of-swords",
    "number": 2,
    "name": "Two of Swords",
    "nameVi": "Hai Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/two-of-swords.jpg",
    "image": "/cards/two-of-swords.jpg",
    "image_filename": "two-of-swords.jpg",
    "uprightKeywords": [
      "quyết định khó khăn",
      "thế bế tắc",
      "cân bằng căng thẳng",
      "do dự"
    ],
    "reversedKeywords": [
      "do dự kéo dài",
      "thông tin bị che giấu",
      "quá tải lựa chọn",
      "mất phương hướng"
    ],
    "keywords": [
      "quyết định khó khăn",
      "thế bế tắc",
      "cân bằng căng thẳng",
      "do dự"
    ],
    "psychologySummary": "Bạn đang đứng ở một ngã rẽ và chọn cách đứng yên vì cả hai hướng đi đều đòi hỏi bạn từ bỏ điều gì đó.",
    "careerFinance": "Bạn đang phân vân giữa hai hướng đi trong công việc và tạm thời chọn cách không chọn gì cả.",
    "loveRelationship": "Bạn đang giữ một thế cân bằng bằng cách không nhìn thẳng vào lựa chọn tình cảm trước mắt, vì nhìn thẳng đồng nghĩa với việc phải chọn.",
    "ventusAdvice": "Có một ngã rẽ nào đó trong cuộc sống hiện tại đang chờ bạn bước tới, và bạn chọn cách đứng yên ở giữa, không hẳn vì không biết mình muốn gì, mà vì cả hai hướng đi đều đòi hỏi bạn phải từ bỏ một điều gì đó quý giá.",
    "quote": "Bạn đang đứng ở một ngã rẽ và chọn cách đứng yên vì cả hai hướng đi đều đòi hỏi bạn từ bỏ điều gì đó."
  },
  {
    "id": "three-of-swords",
    "number": 3,
    "name": "Three of Swords",
    "nameVi": "Ba Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/three-of-swords.jpg",
    "image": "/cards/three-of-swords.jpg",
    "image_filename": "three-of-swords.jpg",
    "uprightKeywords": [
      "đau khổ",
      "tổn thương",
      "chia ly",
      "đau lòng"
    ],
    "reversedKeywords": [
      "chữa lành",
      "tha thứ",
      "vượt qua đau buồn",
      "hồi phục"
    ],
    "keywords": [
      "đau khổ",
      "tổn thương",
      "chia ly",
      "đau lòng"
    ],
    "psychologySummary": "Có một điều gì đó trong cuộc sống đang khiến bạn thật sự đau lòng, và điều đó xứng đáng được thừa nhận thay vì gạt sang một bên.",
    "careerFinance": "Một lời nhận xét hay quyết định trong công việc đã chạm vào bạn thật sự, và cảm giác tổn thương đó xứng đáng được thừa nhận.",
    "loveRelationship": "Có một nỗi đau thật trong chuyện tình cảm đang cần được cảm nhận trọn vẹn, thay vì bị đẩy sang một bên để tỏ ra ổn.",
    "ventusAdvice": "Có một điều gì đó trong cuộc sống của bạn lúc này thật sự khiến bạn đau lòng, có thể liên quan đến một mối quan hệ, một kỳ vọng không thành, hay một sự thật bạn vừa nhận ra về hoàn cảnh của mình.",
    "quote": "Có một điều gì đó trong cuộc sống đang khiến bạn thật sự đau lòng, và điều đó xứng đáng được thừa nhận thay vì gạt sang một bên."
  },
  {
    "id": "four-of-swords",
    "number": 4,
    "name": "Four of Swords",
    "nameVi": "Bốn Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/four-of-swords.jpg",
    "image": "/cards/four-of-swords.jpg",
    "image_filename": "four-of-swords.jpg",
    "uprightKeywords": [
      "nghỉ ngơi",
      "hồi phục",
      "tạm dừng",
      "thiền định"
    ],
    "reversedKeywords": [
      "kiệt sức",
      "trì hoãn nghỉ ngơi",
      "căng thẳng kéo dài",
      "kiệt quệ"
    ],
    "keywords": [
      "nghỉ ngơi",
      "hồi phục",
      "tạm dừng",
      "thiền định"
    ],
    "psychologySummary": "Cuộc sống của bạn đang cần một nhịp chậm lại thật sự, một khoảng lùi để lấy lại sức trước khi bước tiếp.",
    "careerFinance": "Bạn đang cần một khoảng nghỉ thực sự khỏi công việc để lấy lại sức, trước khi tiếp tục bước vào giai đoạn tiếp theo.",
    "loveRelationship": "Mối quan hệ của bạn đang cần một khoảng lặng để cả hai lấy lại năng lượng, thay vì tiếp tục cố gắng khi cả hai đều đã mệt.",
    "ventusAdvice": "Có vẻ như cuộc sống của bạn lúc này đang cần một nhịp chậm lại thật sự, một khoảng lùi để lấy sức trước khi bước tiếp vào giai đoạn kế tiếp. Đây không phải là lời gợi ý để bạn từ bỏ điều gì hay dừng hẳn mọi thứ lại, mà là một lời nhắc rằng ngay cả những hành trình dài nhất cũng cần những điểm dừng để người đi không kiệt sức giữa đường.",
    "quote": "Cuộc sống của bạn đang cần một nhịp chậm lại thật sự, một khoảng lùi để lấy lại sức trước khi bước tiếp."
  },
  {
    "id": "five-of-swords",
    "number": 5,
    "name": "Five of Swords",
    "nameVi": "Năm Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/five-of-swords.jpg",
    "image": "/cards/five-of-swords.jpg",
    "image_filename": "five-of-swords.jpg",
    "uprightKeywords": [
      "xung đột",
      "chiến thắng phải trả giá",
      "bất hòa",
      "ích kỷ"
    ],
    "reversedKeywords": [
      "hòa giải",
      "buông bỏ hận thù",
      "hậu quả xung đột",
      "chấp nhận thua cuộc"
    ],
    "keywords": [
      "xung đột",
      "chiến thắng phải trả giá",
      "bất hòa",
      "ích kỷ"
    ],
    "psychologySummary": "Gần đây có thể bạn vừa giành được một phần thắng nào đó, nhưng đáng để nhìn lại cái giá nó mang theo.",
    "careerFinance": "Bạn có thể vừa thắng một cuộc đấu ở nơi làm việc, nhưng đồng nghiệp xung quanh đang giữ khoảng cách.",
    "loveRelationship": "Bạn vừa thắng một cuộc tranh luận trong tình cảm, nhưng phần thắng đó có thể đang đứng giữa bạn và người kia.",
    "ventusAdvice": "Cuộc sống đôi khi đặt bạn vào những tình huống mà thắng thua rất rõ ràng, và bạn đã ở phía thắng. Có thể đó là một cuộc tranh luận, một quyết định được thông qua theo ý bạn, hay đơn giản là việc bạn chứng minh được mình đúng trước người khác.",
    "quote": "Gần đây có thể bạn vừa giành được một phần thắng nào đó, nhưng đáng để nhìn lại cái giá nó mang theo."
  },
  {
    "id": "six-of-swords",
    "number": 6,
    "name": "Six of Swords",
    "nameVi": "Sáu Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/six-of-swords.jpg",
    "image": "/cards/six-of-swords.jpg",
    "image_filename": "six-of-swords.jpg",
    "uprightKeywords": [
      "chuyển tiếp",
      "rời xa khó khăn",
      "hành trình đến bình yên",
      "buông bỏ quá khứ"
    ],
    "reversedKeywords": [
      "mắc kẹt",
      "kháng cự thay đổi",
      "quá khứ chưa buông",
      "trì trệ"
    ],
    "keywords": [
      "chuyển tiếp",
      "rời xa khó khăn",
      "hành trình đến bình yên",
      "buông bỏ quá khứ"
    ],
    "psychologySummary": "Cuộc sống của bạn có thể đang ở trong một giai đoạn chuyển tiếp chậm rãi, rời xa những khó khăn gần đây để hướng đến sự ổn định hơn.",
    "careerFinance": "Bạn có thể đang trong quá trình rời khỏi một giai đoạn công việc khó khăn để hướng đến một môi trường ổn định hơn.",
    "loveRelationship": "Mối quan hệ của bạn, hoặc chính bạn trong tình yêu, có thể đang ở giữa một cuộc di chuyển chậm rãi từ vùng biển động sang vùng nước yên hơn.",
    "ventusAdvice": "Có thể gần đây bạn đã trải qua một giai đoạn không dễ dàng, dù đó là chuyện tình cảm, công việc, sức khỏe tinh thần hay một biến cố nào khác trong cuộc sống.",
    "quote": "Cuộc sống của bạn có thể đang ở trong một giai đoạn chuyển tiếp chậm rãi, rời xa những khó khăn gần đây để hướng đến sự ổn định hơn."
  },
  {
    "id": "seven-of-swords",
    "number": 7,
    "name": "Seven of Swords",
    "nameVi": "Bảy Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/seven-of-swords.jpg",
    "image": "/cards/seven-of-swords.jpg",
    "image_filename": "seven-of-swords.jpg",
    "uprightKeywords": [
      "lừa dối",
      "chiến lược",
      "hành động lén lút",
      "mưu mẹo"
    ],
    "reversedKeywords": [
      "thú nhận",
      "bị phát hiện",
      "hối lỗi",
      "minh bạch trở lại"
    ],
    "keywords": [
      "lừa dối",
      "chiến lược",
      "hành động lén lút",
      "mưu mẹo"
    ],
    "psychologySummary": "Có thể gần đây bạn đang đi một đường vòng khéo léo quanh một sự thật nào đó, và đáng để tự hỏi điều đó đang bảo vệ ai.",
    "careerFinance": "Bạn có thể đang cân nhắc một hướng đi khôn khéo trong công việc, nhưng đáng để kiểm tra lại ranh giới giữa chiến lược và việc đi đường tắt không lành mạnh.",
    "loveRelationship": "Có thể trong chuyện tình cảm gần đây, bạn hoặc đối phương đang giữ lại một điều gì đó chưa hoàn toàn thành thật.",
    "ventusAdvice": "Có những lúc trong cuộc sống, một chút khéo léo là điều cần thiết, biết chọn thời điểm, biết giữ im lặng khi chưa phải lúc nói, biết đi đường vòng để tránh một xung đột không cần thiết.",
    "quote": "Có thể gần đây bạn đang đi một đường vòng khéo léo quanh một sự thật nào đó, và đáng để tự hỏi điều đó đang bảo vệ ai."
  },
  {
    "id": "eight-of-swords",
    "number": 8,
    "name": "Eight of Swords",
    "nameVi": "Tám Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/eight-of-swords.jpg",
    "image": "/cards/eight-of-swords.jpg",
    "image_filename": "eight-of-swords.jpg",
    "uprightKeywords": [
      "cảm giác bị mắc kẹt",
      "hạn chế tự áp đặt",
      "bất lực",
      "sợ hãi vô hình"
    ],
    "reversedKeywords": [
      "giải thoát bản thân",
      "nhận ra tự do",
      "vượt qua sợ hãi",
      "thay đổi góc nhìn"
    ],
    "keywords": [
      "cảm giác bị mắc kẹt",
      "hạn chế tự áp đặt",
      "bất lực",
      "sợ hãi vô hình"
    ],
    "psychologySummary": "Bạn đang cảm thấy bế tắc trong một phần nào đó của cuộc sống, nhưng phần lớn hàng rào quanh bạn là do chính niềm tin của bạn dựng lên, không phải hoàn cảnh thực sự khoá chặt.",
    "careerFinance": "Bạn đang cảm thấy công việc hiện tại như một cái lồng không lối thoát, nhưng phần lớn song sắt đó là do chính cách bạn nhìn nhận lựa chọn của mình.",
    "loveRelationship": "Bạn cảm thấy bị mắc kẹt trong một mối quan hệ hoặc một nỗi sợ về tình cảm, nhưng phần lớn hàng rào đó do chính bạn dựng lên.",
    "ventusAdvice": "Có một cảm giác bị vây kín đang hiện diện trong cuộc sống của bạn lúc này, như thể mọi lối ra đều đã bị chặn từ trước và bạn chỉ còn cách đứng yên tại chỗ.",
    "quote": "Bạn đang cảm thấy bế tắc trong một phần nào đó của cuộc sống, nhưng phần lớn hàng rào quanh bạn là do chính niềm tin của bạn dựng lên, không phải hoàn cảnh thực sự khoá chặt."
  },
  {
    "id": "nine-of-swords",
    "number": 9,
    "name": "Nine of Swords",
    "nameVi": "Chín Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/nine-of-swords.jpg",
    "image": "/cards/nine-of-swords.jpg",
    "image_filename": "nine-of-swords.jpg",
    "uprightKeywords": [
      "lo âu",
      "ác mộng",
      "căng thẳng tâm lý",
      "tội lỗi"
    ],
    "reversedKeywords": [
      "hy vọng trở lại",
      "vượt qua lo âu",
      "tìm kiếm giúp đỡ",
      "giải tỏa nỗi sợ"
    ],
    "keywords": [
      "lo âu",
      "ác mộng",
      "căng thẳng tâm lý",
      "tội lỗi"
    ],
    "psychologySummary": "Bạn đang trải qua một giai đoạn lo âu và căng thẳng kéo dài, và điều quan trọng lúc này là nhận ra nỗi sợ trong đầu thường lớn hơn thực tế đang diễn ra.",
    "careerFinance": "Áp lực công việc đang khiến bạn trằn trọc lo âu và tự trách bản thân nhiều hơn mức cần thiết, dù thực tế có thể không nghiêm trọng như tâm trí đang vẽ ra.",
    "loveRelationship": "Bạn đang trải qua những đêm trằn trọc lo âu về chuyện tình cảm, và phần lớn nỗi sợ đó lớn hơn nhiều so với những gì thực sự đang diễn ra.",
    "ventusAdvice": "Có một cảm giác nặng nề đang bao trùm bạn lúc này, biểu hiện qua những đêm khó ngủ, những suy nghĩ lo âu lặp đi lặp lại, và đôi khi cả một cảm giác tội lỗi không rõ nguồn gốc cụ thể.",
    "quote": "Bạn đang trải qua một giai đoạn lo âu và căng thẳng kéo dài, và điều quan trọng lúc này là nhận ra nỗi sợ trong đầu thường lớn hơn thực tế đang diễn ra."
  },
  {
    "id": "ten-of-swords",
    "number": 10,
    "name": "Ten of Swords",
    "nameVi": "Mười Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/ten-of-swords.jpg",
    "image": "/cards/ten-of-swords.jpg",
    "image_filename": "ten-of-swords.jpg",
    "uprightKeywords": [
      "kết thúc đau đớn",
      "phản bội",
      "chạm đáy",
      "kiệt quệ"
    ],
    "reversedKeywords": [
      "hồi phục",
      "kết thúc không thể tránh khỏi",
      "ánh sáng cuối đường hầm",
      "vượt qua khủng hoảng"
    ],
    "keywords": [
      "kết thúc đau đớn",
      "phản bội",
      "chạm đáy",
      "kiệt quệ"
    ],
    "psychologySummary": "Bạn đang trải qua một kết thúc đau đớn hoặc một giai đoạn chạm đáy trong cuộc sống, nhưng đây cũng chính là điểm mà mọi thứ chỉ còn có thể đi lên.",
    "careerFinance": "Bạn đang trải qua một kết thúc khó khăn trong công việc, có thể là mất một vị trí hoặc một dự án quan trọng, nhưng điểm chạm đáy này cũng là nơi mọi thứ bắt đầu được xây lại.",
    "loveRelationship": "Bạn đang trải qua một kết thúc đau đớn trong tình cảm, có thể kèm cảm giác bị phản bội, nhưng đây cũng là điểm thấp nhất mà từ đó mọi thứ chỉ có thể bắt đầu đi lên.",
    "ventusAdvice": "Có một điều gì đó trong cuộc sống của bạn vừa kết thúc theo cách đau đớn, có thể đột ngột hoặc sau một thời gian dài rạn nứt, và cảm giác kiệt quệ đi kèm theo đó là hoàn toàn dễ hiểu.",
    "quote": "Bạn đang trải qua một kết thúc đau đớn hoặc một giai đoạn chạm đáy trong cuộc sống, nhưng đây cũng chính là điểm mà mọi thứ chỉ còn có thể đi lên."
  },
  {
    "id": "page-of-swords",
    "number": 11,
    "name": "Page of Swords",
    "nameVi": "Thị Đồng Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/page-of-swords.jpg",
    "image": "/cards/page-of-swords.jpg",
    "image_filename": "page-of-swords.jpg",
    "uprightKeywords": [
      "tò mò",
      "tư duy sắc bén",
      "tin tức mới",
      "cảnh giác"
    ],
    "reversedKeywords": [
      "tin đồn",
      "thiếu suy nghĩ",
      "hấp tấp",
      "do thám"
    ],
    "keywords": [
      "tò mò",
      "tư duy sắc bén",
      "tin tức mới",
      "cảnh giác"
    ],
    "psychologySummary": "Đây là giai đoạn thích hợp để quan sát, đặt câu hỏi và tìm hiểu kỹ trước khi hành động, thay vì phản ứng theo cảm tính.",
    "careerFinance": "Bạn đang ở giai đoạn thu thập thông tin và học hỏi nhanh trong công việc, và sự nhạy bén này có thể trở thành lợi thế nếu bạn biết dùng đúng lúc.",
    "loveRelationship": "Bạn đang tò mò muốn hiểu người ấy sâu hơn trước khi trao thêm niềm tin, và sự quan sát tỉnh táo này đang giúp ích chứ không phải cản trở.",
    "ventusAdvice": "Cuộc sống của bạn lúc này có vẻ đang đưa đến nhiều thông tin mới hơn bình thường, từ những cuộc trò chuyện bất ngờ đến những tin tức khiến bạn phải dừng lại suy nghĩ.",
    "quote": "Đây là giai đoạn thích hợp để quan sát, đặt câu hỏi và tìm hiểu kỹ trước khi hành động, thay vì phản ứng theo cảm tính."
  },
  {
    "id": "knight-of-swords",
    "number": 12,
    "name": "Knight of Swords",
    "nameVi": "Kỵ Sĩ Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/knight-of-swords.jpg",
    "image": "/cards/knight-of-swords.jpg",
    "image_filename": "knight-of-swords.jpg",
    "uprightKeywords": [
      "hành động quyết liệt",
      "tham vọng",
      "tốc độ",
      "thẳng thắn"
    ],
    "reversedKeywords": [
      "liều lĩnh",
      "hung hăng",
      "thiếu kiên nhẫn",
      "tranh cãi"
    ],
    "keywords": [
      "hành động quyết liệt",
      "tham vọng",
      "tốc độ",
      "thẳng thắn"
    ],
    "psychologySummary": "Đây là giai đoạn thuận lợi để hành động dứt khoát với một mục tiêu bạn đã ấp ủ, thay vì tiếp tục chờ đợi thời điểm hoàn hảo.",
    "careerFinance": "Bạn đang có đủ quyết tâm và tốc độ để theo đuổi một mục tiêu công việc cụ thể, và đây là lúc hành động thay vì chỉ lên kế hoạch thêm nữa.",
    "loveRelationship": "Bạn đang có xu hướng hành động dứt khoát và nói thẳng điều mình muốn trong chuyện tình cảm, và sự rõ ràng đó có thể là điều mối quan hệ này đang cần.",
    "ventusAdvice": "Có một luồng động lực mạnh mẽ đang đẩy bạn tiến về phía trước trong nhiều mặt của cuộc sống. Bạn không còn muốn chần chừ, muốn cân nhắc thêm, mà muốn thấy kết quả cụ thể từ những gì mình đã chuẩn bị bấy lâu.",
    "quote": "Đây là giai đoạn thuận lợi để hành động dứt khoát với một mục tiêu bạn đã ấp ủ, thay vì tiếp tục chờ đợi thời điểm hoàn hảo."
  },
  {
    "id": "queen-of-swords",
    "number": 13,
    "name": "Queen of Swords",
    "nameVi": "Nữ Hoàng Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/queen-of-swords.jpg",
    "image": "/cards/queen-of-swords.jpg",
    "image_filename": "queen-of-swords.jpg",
    "uprightKeywords": [
      "độc lập",
      "tư duy rõ ràng",
      "thẳng thắn",
      "kinh nghiệm sống"
    ],
    "reversedKeywords": [
      "lạnh lùng",
      "cay nghiệt",
      "cô lập",
      "phán xét khắc nghiệt"
    ],
    "keywords": [
      "độc lập",
      "tư duy rõ ràng",
      "thẳng thắn",
      "kinh nghiệm sống"
    ],
    "psychologySummary": "Bạn đang có khả năng nhìn nhận cuộc sống của mình một cách rõ ràng và độc lập, dựa trên những gì đã từng trải, và đây là nguồn sức mạnh đáng tin cậy lúc này.",
    "careerFinance": "Kinh nghiệm và sự rõ ràng trong tư duy đang là lợi thế lớn của bạn ở công việc lúc này, giúp bạn đưa ra quyết định và nói lên ý kiến một cách tự tin.",
    "loveRelationship": "Bạn đang nhìn chuyện tình cảm của mình bằng con mắt rõ ràng, tỉnh táo, dựa trên những gì bản thân đã từng trải qua, và điều đó đang giúp bạn đưa ra lựa chọn phù hợp hơn.",
    "ventusAdvice": "Có một sự trưởng thành rõ rệt trong cách bạn đối diện với mọi việc gần đây, không còn dễ bị cuốn theo cảm xúc nhất thời hay ý kiến của số đông. Những gì bạn từng trải qua, kể cả những giai đoạn khó khăn, giờ đang trở thành nền tảng cho sự sáng suốt bạn có được hôm nay.",
    "quote": "Bạn đang có khả năng nhìn nhận cuộc sống của mình một cách rõ ràng và độc lập, dựa trên những gì đã từng trải, và đây là nguồn sức mạnh đáng tin cậy lúc này."
  },
  {
    "id": "king-of-swords",
    "number": 14,
    "name": "King of Swords",
    "nameVi": "Vua Kiếm",
    "arcana": "minor",
    "arcanaType": "swords",
    "arcanaLabelVi": "Bộ Kiếm",
    "suit": "swords",
    "imageUrl": "/cards/king-of-swords.jpg",
    "image": "/cards/king-of-swords.jpg",
    "image_filename": "king-of-swords.jpg",
    "uprightKeywords": [
      "quyền uy trí tuệ",
      "công bằng",
      "tư duy logic",
      "sự thật"
    ],
    "reversedKeywords": [
      "lạm quyền",
      "thao túng",
      "độc đoán",
      "lạnh lùng"
    ],
    "keywords": [
      "quyền uy trí tuệ",
      "công bằng",
      "tư duy logic",
      "sự thật"
    ],
    "psychologySummary": "Nhìn chung, đây là giai đoạn thuận lợi để hành động dựa trên sự thật và sự công tâm, thay vì cảm xúc nhất thời.",
    "careerFinance": "Trong công việc, lá này khuyến khích bạn dẫn dắt bằng lý lẽ rõ ràng và giữ vững nguyên tắc thay vì chạy theo cảm xúc nhất thời của tập thể.",
    "loveRelationship": "Trong tình yêu, lá này gọi bạn quay về với sự tỉnh táo và thẳng thắn để nhìn mối quan hệ đúng như nó đang là.",
    "ventusAdvice": "Có một luồng năng lượng rõ ràng, sắc bén đang hiện diện trong giai đoạn này của bạn, mời bạn nhìn thẳng vào mọi việc đúng như bản chất của chúng thay vì qua lăng kính của hy vọng hay lo sợ.",
    "quote": "Nhìn chung, đây là giai đoạn thuận lợi để hành động dựa trên sự thật và sự công tâm, thay vì cảm xúc nhất thời."
  },
  {
    "id": "ace-of-pentacles",
    "number": 1,
    "name": "Ace of Pentacles",
    "nameVi": "Át Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/ace-of-pentacles.jpg",
    "image": "/cards/ace-of-pentacles.jpg",
    "image_filename": "ace-of-pentacles.jpg",
    "uprightKeywords": [
      "cơ hội mới",
      "thịnh vượng",
      "ổn định vật chất",
      "khởi đầu tài chính"
    ],
    "reversedKeywords": [
      "cơ hội bị bỏ lỡ",
      "kế hoạch tài chính thất bại",
      "bất ổn",
      "thiếu chuẩn bị"
    ],
    "keywords": [
      "cơ hội mới",
      "thịnh vượng",
      "ổn định vật chất",
      "khởi đầu tài chính"
    ],
    "psychologySummary": "Nhìn chung, một cơ hội cụ thể và đầy hứa hẹn đang mở ra trước mắt bạn, đáng để đón nhận bằng sự kiên nhẫn và thực tế.",
    "careerFinance": "Trong công việc, một cơ hội cụ thể và đầy tiềm năng đang mở ra, đáng để bạn nghiêm túc đầu tư thời gian và công sức.",
    "loveRelationship": "Trong tình yêu, lá này báo hiệu một khởi đầu chân thành và đầy tiềm năng, đáng để bạn dành thời gian vun đắp từ những bước nhỏ đầu tiên.",
    "ventusAdvice": "Có một khởi đầu mới đang chờ được bạn để ý trong giai đoạn này, dù nó có thể xuất hiện dưới một hình hài khiêm tốn chứ không phải ồn ào hay kịch tính. Đó có thể là một cơ hội trong công việc, một mối quan hệ mới, một nguồn thu nhập, hay đơn giản là một cảm giác ổn định hơn đang dần trở lại sau một giai đoạn nhiều biến động.",
    "quote": "Nhìn chung, một cơ hội cụ thể và đầy hứa hẹn đang mở ra trước mắt bạn, đáng để đón nhận bằng sự kiên nhẫn và thực tế."
  },
  {
    "id": "two-of-pentacles",
    "number": 2,
    "name": "Two of Pentacles",
    "nameVi": "Hai Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/two-of-pentacles.jpg",
    "image": "/cards/two-of-pentacles.jpg",
    "image_filename": "two-of-pentacles.jpg",
    "uprightKeywords": [
      "cân bằng",
      "thích nghi",
      "quản lý nhiều việc",
      "linh hoạt"
    ],
    "reversedKeywords": [
      "mất cân bằng",
      "quá tải",
      "quản lý kém",
      "bất ổn tài chính"
    ],
    "keywords": [
      "cân bằng",
      "thích nghi",
      "quản lý nhiều việc",
      "linh hoạt"
    ],
    "psychologySummary": "Nhìn chung, đây là giai đoạn bạn đang khéo léo xoay sở giữa nhiều khía cạnh của cuộc sống, và sự linh hoạt chính là chìa khóa giúp mọi thứ vận hành trơn tru.",
    "careerFinance": "Trong công việc, bạn đang khéo léo xoay sở giữa nhiều đầu việc cùng lúc, và khả năng thích ứng linh hoạt chính là thế mạnh lớn nhất lúc này.",
    "loveRelationship": "Trong tình cảm, đây là giai đoạn bạn đang khéo léo cân bằng giữa nhiều ưu tiên, và sự linh hoạt chính là điều giúp mối quan hệ tiếp tục vững vàng.",
    "ventusAdvice": "Cuộc sống của bạn trong giai đoạn này có thể đang đòi hỏi bạn phải cùng lúc quan tâm đến nhiều khía cạnh khác nhau, công việc, các mối quan hệ, sức khỏe, tài chính, và đôi khi cảm giác như đang tung hứng quá nhiều quả bóng cùng một lúc mà không chắc mình có giữ vững được tất cả hay không.",
    "quote": "Nhìn chung, đây là giai đoạn bạn đang khéo léo xoay sở giữa nhiều khía cạnh của cuộc sống, và sự linh hoạt chính là chìa khóa giúp mọi thứ vận hành trơn tru."
  },
  {
    "id": "three-of-pentacles",
    "number": 3,
    "name": "Three of Pentacles",
    "nameVi": "Ba Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/three-of-pentacles.jpg",
    "image": "/cards/three-of-pentacles.jpg",
    "image_filename": "three-of-pentacles.jpg",
    "uprightKeywords": [
      "hợp tác",
      "kỹ năng",
      "học hỏi",
      "xây dựng nền tảng"
    ],
    "reversedKeywords": [
      "thiếu hợp tác",
      "làm việc kém chất lượng",
      "xung đột nhóm",
      "thiếu kỹ năng"
    ],
    "keywords": [
      "hợp tác",
      "kỹ năng",
      "học hỏi",
      "xây dựng nền tảng"
    ],
    "psychologySummary": "Đây là giai đoạn mọi thứ tiến triển tốt nhờ sự hợp tác và học hỏi, không phải nỗ lực đơn độc.",
    "careerFinance": "Công việc đang tiến triển tốt nhờ sự phối hợp nhịp nhàng với đồng nghiệp, không phải nỗ lực đơn độc.",
    "loveRelationship": "Một mối quan hệ đang được xây từng bước qua sự phối hợp ăn ý, không phải ngẫu nhiên mà thành.",
    "ventusAdvice": "Nhìn tổng thể, giai đoạn này của bạn được đánh dấu bởi sự xây dựng — từng bước, có phối hợp, và dựa trên nền tảng đang dần vững chắc hơn theo thời gian.",
    "quote": "Đây là giai đoạn mọi thứ tiến triển tốt nhờ sự hợp tác và học hỏi, không phải nỗ lực đơn độc."
  },
  {
    "id": "four-of-pentacles",
    "number": 4,
    "name": "Four of Pentacles",
    "nameVi": "Bốn Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/four-of-pentacles.jpg",
    "image": "/cards/four-of-pentacles.jpg",
    "image_filename": "four-of-pentacles.jpg",
    "uprightKeywords": [
      "kiểm soát",
      "tiết kiệm",
      "an toàn",
      "bám giữ của cải"
    ],
    "reversedKeywords": [
      "keo kiệt",
      "sợ mất mát",
      "bám víu quá mức",
      "buông bỏ vật chất"
    ],
    "keywords": [
      "kiểm soát",
      "tiết kiệm",
      "an toàn",
      "bám giữ của cải"
    ],
    "psychologySummary": "Bạn đang ưu tiên sự an toàn và kiểm soát trong giai đoạn này, điều hợp lý nhưng cần cân bằng để không tự giới hạn mình.",
    "careerFinance": "Bạn đang ưu tiên sự ổn định và an toàn trong công việc, có thể đến mức ngại thử điều mới.",
    "loveRelationship": "Bạn đang giữ khoảng cách an toàn trong tình cảm để bảo vệ bản thân, nhưng điều đó cũng có thể đang cản trở sự gần gũi.",
    "ventusAdvice": "Nhìn chung, đây là giai đoạn bạn có xu hướng giữ chặt những gì mình đã xây dựng được — dù là tiền bạc, mối quan hệ, vị trí công việc, hay đơn giản là thói quen sống quen thuộc.",
    "quote": "Bạn đang ưu tiên sự an toàn và kiểm soát trong giai đoạn này, điều hợp lý nhưng cần cân bằng để không tự giới hạn mình."
  },
  {
    "id": "five-of-pentacles",
    "number": 5,
    "name": "Five of Pentacles",
    "nameVi": "Năm Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/five-of-pentacles.jpg",
    "image": "/cards/five-of-pentacles.jpg",
    "image_filename": "five-of-pentacles.jpg",
    "uprightKeywords": [
      "khó khăn tài chính",
      "thiếu thốn",
      "cô lập",
      "bất an"
    ],
    "reversedKeywords": [
      "hồi phục tài chính",
      "tìm được giúp đỡ",
      "vượt qua khó khăn",
      "hy vọng trở lại"
    ],
    "keywords": [
      "khó khăn tài chính",
      "thiếu thốn",
      "cô lập",
      "bất an"
    ],
    "psychologySummary": "Bạn có thể đang trải qua một giai đoạn khó khăn hoặc thiếu thốn, và điều quan trọng nhất lúc này là không tự cô lập mình.",
    "careerFinance": "Bạn có thể đang trải qua giai đoạn khó khăn hoặc bấp bênh trong công việc, và không cần phải tự mình vượt qua một mình.",
    "loveRelationship": "Bạn có thể đang cảm thấy thiếu thốn hoặc cô đơn trong tình cảm, nhưng sự hỗ trợ có thể gần hơn bạn nghĩ nếu bạn cho phép mình tìm đến nó.",
    "ventusAdvice": "Nhìn tổng thể, đây có thể là một giai đoạn không dễ dàng — dù là về tài chính, sức khỏe tinh thần, các mối quan hệ, hay cảm giác chung rằng mọi thứ đang khó khăn hơn bình thường.",
    "quote": "Bạn có thể đang trải qua một giai đoạn khó khăn hoặc thiếu thốn, và điều quan trọng nhất lúc này là không tự cô lập mình."
  },
  {
    "id": "six-of-pentacles",
    "number": 6,
    "name": "Six of Pentacles",
    "nameVi": "Sáu Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/six-of-pentacles.jpg",
    "image": "/cards/six-of-pentacles.jpg",
    "image_filename": "six-of-pentacles.jpg",
    "uprightKeywords": [
      "hào phóng",
      "cho và nhận",
      "cân bằng tài chính",
      "hỗ trợ"
    ],
    "reversedKeywords": [
      "mất cân bằng quyền lực",
      "nợ nần",
      "cho nhận không công bằng",
      "ích kỷ"
    ],
    "keywords": [
      "hào phóng",
      "cho và nhận",
      "cân bằng tài chính",
      "hỗ trợ"
    ],
    "psychologySummary": "Sáu Tiền xuôi nói chung nhắc bạn nhìn lại các mối quan hệ quanh mình để thấy đâu là nơi mình đang cho đi, đâu là nơi mình đang được nâng đỡ.",
    "careerFinance": "Sáu Tiền xuôi trong công việc gợi ý bạn đang ở vị trí có thể chia sẻ nguồn lực, kinh nghiệm hoặc cơ hội với người khác, hoặc đang nhận được sự hỗ trợ đúng lúc mình cần.",
    "loveRelationship": "Sáu Tiền xuôi nhắc bạn nhìn lại xem tình cảm giữa hai người có đang chảy đều hai chiều hay không.",
    "ventusAdvice": "Ở giai đoạn này, cuộc sống của bạn có thể đang xoay quanh những trao đổi qua lại với người khác, có thể là thời gian, sự chú ý, công sức hoặc những thứ cụ thể hơn.",
    "quote": "Sáu Tiền xuôi nói chung nhắc bạn nhìn lại các mối quan hệ quanh mình để thấy đâu là nơi mình đang cho đi, đâu là nơi mình đang được nâng đỡ."
  },
  {
    "id": "seven-of-pentacles",
    "number": 7,
    "name": "Seven of Pentacles",
    "nameVi": "Bảy Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/seven-of-pentacles.jpg",
    "image": "/cards/seven-of-pentacles.jpg",
    "image_filename": "seven-of-pentacles.jpg",
    "uprightKeywords": [
      "kiên nhẫn",
      "đầu tư dài hạn",
      "đánh giá thành quả",
      "chờ đợi"
    ],
    "reversedKeywords": [
      "thiếu kiên nhẫn",
      "đầu tư sai lầm",
      "kết quả không như mong đợi",
      "bỏ cuộc sớm"
    ],
    "keywords": [
      "kiên nhẫn",
      "đầu tư dài hạn",
      "đánh giá thành quả",
      "chờ đợi"
    ],
    "psychologySummary": "Bảy Tiền xuôi nói chung nhắc bạn tạm dừng để đánh giá những gì mình đã đầu tư công sức trong thời gian qua, trước khi tiếp tục bước tới.",
    "careerFinance": "Bảy Tiền xuôi trong công việc nhắc bạn dừng lại nhìn nhận thành quả từ những nỗ lực đã bỏ ra, thay vì chỉ mải miết làm tiếp mà không đánh giá.",
    "loveRelationship": "Bảy Tiền xuôi trong tình yêu là lúc để bạn dừng lại đánh giá xem những công sức đã bỏ ra cho mối quan hệ đang dẫn tới đâu.",
    "ventusAdvice": "Có một điều gì đó trong cuộc sống bạn đã dành khá nhiều thời gian và tâm sức để vun đắp, và đây là thời điểm phù hợp để dừng lại một chút, nhìn lại toàn cảnh thay vì cứ tiếp tục lao về phía trước mà không đánh giá.",
    "quote": "Bảy Tiền xuôi nói chung nhắc bạn tạm dừng để đánh giá những gì mình đã đầu tư công sức trong thời gian qua, trước khi tiếp tục bước tới."
  },
  {
    "id": "eight-of-pentacles",
    "number": 8,
    "name": "Eight of Pentacles",
    "nameVi": "Tám Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/eight-of-pentacles.jpg",
    "image": "/cards/eight-of-pentacles.jpg",
    "image_filename": "eight-of-pentacles.jpg",
    "uprightKeywords": [
      "chăm chỉ",
      "tận tâm",
      "rèn luyện kỹ năng",
      "chú trọng chi tiết"
    ],
    "reversedKeywords": [
      "làm việc cẩu thả",
      "thiếu tham vọng",
      "trì trệ kỹ năng",
      "thiếu tập trung"
    ],
    "keywords": [
      "chăm chỉ",
      "tận tâm",
      "rèn luyện kỹ năng",
      "chú trọng chi tiết"
    ],
    "psychologySummary": "Tám Tiền xuôi nói chung là lời nhắc về giá trị của sự chăm chỉ đều đặn, chú trọng từng chi tiết nhỏ trong bất cứ điều gì bạn đang theo đuổi.",
    "careerFinance": "Tám Tiền xuôi trong công việc phản ánh giai đoạn bạn đang tập trung mài giũa chuyên môn, chú trọng từng chi tiết để làm tốt hơn mỗi ngày.",
    "loveRelationship": "Tám Tiền xuôi trong tình yêu nói về việc chủ động dành công sức trau dồi cách bạn yêu và kết nối, thay vì để mọi thứ diễn ra theo quán tính.",
    "ventusAdvice": "Có một điều gì đó trong cuộc sống hiện tại đang cần đến sự kiên trì và chăm chút tỉ mỉ từ bạn, thay vì một cú bứt phá nhanh chóng. Có thể đó là một kỹ năng bạn đang học, một thói quen bạn đang xây dựng, hoặc đơn giản là cách bạn tiếp cận công việc hằng ngày với sự cẩn trọng hơn trước.",
    "quote": "Tám Tiền xuôi nói chung là lời nhắc về giá trị của sự chăm chỉ đều đặn, chú trọng từng chi tiết nhỏ trong bất cứ điều gì bạn đang theo đuổi."
  },
  {
    "id": "nine-of-pentacles",
    "number": 9,
    "name": "Nine of Pentacles",
    "nameVi": "Chín Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/nine-of-pentacles.jpg",
    "image": "/cards/nine-of-pentacles.jpg",
    "image_filename": "nine-of-pentacles.jpg",
    "uprightKeywords": [
      "sung túc",
      "độc lập tài chính",
      "tận hưởng thành quả",
      "tự chủ"
    ],
    "reversedKeywords": [
      "phụ thuộc tài chính",
      "thể hiện quá mức",
      "bất an vật chất",
      "cô đơn"
    ],
    "keywords": [
      "sung túc",
      "độc lập tài chính",
      "tận hưởng thành quả",
      "tự chủ"
    ],
    "psychologySummary": "Cuộc sống của bạn đang ở một giai đoạn ổn định do chính bạn tạo dựng, và đây là lúc để dừng lại tận hưởng thay vì luôn hướng tới mục tiêu kế tiếp.",
    "careerFinance": "Đây là giai đoạn thành quả công việc đến từ kỷ luật bạn tự đặt ra, và bạn xứng đáng công nhận điều đó thay vì vội tìm việc tiếp theo.",
    "loveRelationship": "Sự đủ đầy bạn đang cảm nhận một mình chính là nền tảng để bước vào tình yêu mà không cần lấp chỗ trống, chứ không phải rào cản với ai đó.",
    "ventusAdvice": "Bạn đang đứng ở một điểm khá dễ chịu trong cuộc sống — mọi thứ không hoàn hảo, nhưng đủ vững để bạn cảm thấy có thể tự lo cho mình mà không cần dựa dẫm.",
    "quote": "Cuộc sống của bạn đang ở một giai đoạn ổn định do chính bạn tạo dựng, và đây là lúc để dừng lại tận hưởng thay vì luôn hướng tới mục tiêu kế tiếp."
  },
  {
    "id": "ten-of-pentacles",
    "number": 10,
    "name": "Ten of Pentacles",
    "nameVi": "Mười Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/ten-of-pentacles.jpg",
    "image": "/cards/ten-of-pentacles.jpg",
    "image_filename": "ten-of-pentacles.jpg",
    "uprightKeywords": [
      "di sản",
      "thịnh vượng lâu dài",
      "gia đình",
      "ổn định thế hệ"
    ],
    "reversedKeywords": [
      "mất mát tài sản",
      "bất hòa gia đình vì tiền bạc",
      "bất ổn",
      "kế hoạch tài chính đổ vỡ"
    ],
    "keywords": [
      "di sản",
      "thịnh vượng lâu dài",
      "gia đình",
      "ổn định thế hệ"
    ],
    "psychologySummary": "Cuộc sống của bạn đang có xu hướng hướng về sự ổn định lâu dài, với gia đình hoặc gốc rễ đóng vai trò quan trọng trong bức tranh tổng thể.",
    "careerFinance": "Đây là lá bài của sự nghiệp mang tính xây dựng lâu dài, nơi bạn đang đặt những viên gạch cho một điều gì đó sẽ còn tồn tại xa hơn hiện tại.",
    "loveRelationship": "Lá này nói về tình yêu mang tính lâu dài, kiểu gắn bó nghĩ đến tương lai chung chứ không chỉ cảm xúc nhất thời của hiện tại.",
    "ventusAdvice": "Có một cảm giác bền vững đang hình thành trong cuộc sống của bạn lúc này, kiểu ổn định không đến trong một sớm một chiều mà được xây dựng qua nhiều lựa chọn nhỏ liên tiếp.",
    "quote": "Cuộc sống của bạn đang có xu hướng hướng về sự ổn định lâu dài, với gia đình hoặc gốc rễ đóng vai trò quan trọng trong bức tranh tổng thể."
  },
  {
    "id": "page-of-pentacles",
    "number": 11,
    "name": "Page of Pentacles",
    "nameVi": "Thị Đồng Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/page-of-pentacles.jpg",
    "image": "/cards/page-of-pentacles.jpg",
    "image_filename": "page-of-pentacles.jpg",
    "uprightKeywords": [
      "cơ hội học hỏi",
      "tham vọng thực tế",
      "tin tức tài chính",
      "chăm chỉ học hỏi"
    ],
    "reversedKeywords": [
      "thiếu kế hoạch",
      "cơ hội bị bỏ lỡ",
      "thiếu tập trung",
      "trì hoãn học hỏi"
    ],
    "keywords": [
      "cơ hội học hỏi",
      "tham vọng thực tế",
      "tin tức tài chính",
      "chăm chỉ học hỏi"
    ],
    "psychologySummary": "Đây là giai đoạn khởi đầu đầy tiềm năng trong cuộc sống, nơi sự tò mò và chăm chỉ học hỏi quan trọng hơn việc đã có sẵn câu trả lời.",
    "careerFinance": "Đây là lá bài của một khởi đầu đầy tiềm năng trong công việc — nơi sự chăm chỉ và tinh thần học hỏi quan trọng hơn kinh nghiệm sẵn có.",
    "loveRelationship": "Lá này gợi ý một giai đoạn học hỏi trong tình yêu — tiếp cận với sự tò mò và chân thành của người mới bắt đầu, thay vì đã biết hết mọi câu trả lời.",
    "ventusAdvice": "Cuộc sống của bạn lúc này có thể đang mở ra một chương mới nào đó — chưa rõ ràng hoàn toàn, nhưng đầy tiềm năng để khám phá. Đây là giai đoạn phù hợp để giữ tinh thần của người mới bắt đầu: tò mò, sẵn sàng học hỏi, không ngại thừa nhận những gì mình chưa biết.",
    "quote": "Đây là giai đoạn khởi đầu đầy tiềm năng trong cuộc sống, nơi sự tò mò và chăm chỉ học hỏi quan trọng hơn việc đã có sẵn câu trả lời."
  },
  {
    "id": "knight-of-pentacles",
    "number": 12,
    "name": "Knight of Pentacles",
    "nameVi": "Kỵ Sĩ Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/knight-of-pentacles.jpg",
    "image": "/cards/knight-of-pentacles.jpg",
    "image_filename": "knight-of-pentacles.jpg",
    "uprightKeywords": [
      "chăm chỉ",
      "đáng tin cậy",
      "kiên trì",
      "thực tế"
    ],
    "reversedKeywords": [
      "trì trệ",
      "cứng nhắc",
      "lười biếng",
      "sợ thay đổi"
    ],
    "keywords": [
      "chăm chỉ",
      "đáng tin cậy",
      "kiên trì",
      "thực tế"
    ],
    "psychologySummary": "Đây là giai đoạn để tiến chậm mà chắc, ưu tiên sự đều đặn hơn là tốc độ trong bất kỳ việc gì đang theo đuổi.",
    "careerFinance": "Sự nghiệp phát triển ở đây theo kiểu tích lũy: từng nhiệm vụ hoàn thành đúng hẹn, từng cam kết được giữ.",
    "loveRelationship": "Tình cảm với lá này không đến từ tia sét mà từ những hành động đều đặn, đáng tin theo thời gian.",
    "ventusAdvice": "Không phải mọi hành trình đều cần bắt đầu bằng một cú bứt phá. Lá này mang năng lượng của người cắm đầu làm việc, từng bước, không phô trương, và tin rằng sự đều đặn cuối cùng sẽ đưa mình đến nơi cần đến.",
    "quote": "Đây là giai đoạn để tiến chậm mà chắc, ưu tiên sự đều đặn hơn là tốc độ trong bất kỳ việc gì đang theo đuổi."
  },
  {
    "id": "queen-of-pentacles",
    "number": 13,
    "name": "Queen of Pentacles",
    "nameVi": "Nữ Hoàng Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/queen-of-pentacles.jpg",
    "image": "/cards/queen-of-pentacles.jpg",
    "image_filename": "queen-of-pentacles.jpg",
    "uprightKeywords": [
      "nuôi dưỡng",
      "thực tế",
      "sung túc",
      "chăm sóc gia đình"
    ],
    "reversedKeywords": [
      "mất cân bằng công việc-cuộc sống",
      "bất an tài chính",
      "thờ ơ",
      "quá bảo bọc"
    ],
    "keywords": [
      "nuôi dưỡng",
      "thực tế",
      "sung túc",
      "chăm sóc gia đình"
    ],
    "psychologySummary": "Đây là giai đoạn để vun đắp sự ổn định và chăm sóc những gì bạn đang có, thay vì chạy theo điều gì mới mẻ hơn.",
    "careerFinance": "Đây là kiểu thành công đến từ việc kết hợp sự chu đáo với người khác và năng lực quản lý thực tế công việc.",
    "loveRelationship": "Tình yêu ở đây thể hiện qua sự chăm sóc thiết thực, bữa ăn nấu sẵn, sự hiện diện ổn định, một mái nhà cảm thấy an toàn.",
    "ventusAdvice": "Có một sự ấm áp lặng lẽ trong năng lượng của lá này, kiểu ấm áp đến từ việc chăm sóc những gì đang có thay vì luôn hướng ra tìm kiếm điều gì mới. Dù đó là ngôi nhà bạn đang sống, những mối quan hệ bạn đang giữ, hay chính cơ thể và tâm trí của bạn, đây là lời mời để bạn dành thời gian vun đắp thay vì mở rộng thêm.",
    "quote": "Đây là giai đoạn để vun đắp sự ổn định và chăm sóc những gì bạn đang có, thay vì chạy theo điều gì mới mẻ hơn."
  },
  {
    "id": "king-of-pentacles",
    "number": 14,
    "name": "King of Pentacles",
    "nameVi": "Vua Tiền",
    "arcana": "minor",
    "arcanaType": "pentacles",
    "arcanaLabelVi": "Bộ Tiền",
    "suit": "pentacles",
    "imageUrl": "/cards/king-of-pentacles.jpg",
    "image": "/cards/king-of-pentacles.jpg",
    "image_filename": "king-of-pentacles.jpg",
    "uprightKeywords": [
      "thành công vật chất",
      "ổn định",
      "lãnh đạo kinh doanh",
      "hào phóng"
    ],
    "reversedKeywords": [
      "tham lam",
      "cứng nhắc",
      "ám ảnh vật chất",
      "kiểm soát quá mức"
    ],
    "keywords": [
      "thành công vật chất",
      "ổn định",
      "lãnh đạo kinh doanh",
      "hào phóng"
    ],
    "psychologySummary": "Đây là giai đoạn của sự làm chủ và ổn định, nơi những nỗ lực trước đó bắt đầu kết trái thành một nền tảng vững chắc.",
    "careerFinance": "Sự nghiệp đang ở giai đoạn chín muồi, nơi năng lực và uy tín đã được xây dựng đủ để bạn dẫn dắt thay vì chỉ theo sau.",
    "loveRelationship": "Đây là kiểu tình yêu mang lại cảm giác an toàn vững chắc, từ một người biết chăm lo mà không cần phô trương.",
    "ventusAdvice": "Có một cảm giác trưởng thành bao trùm năng lượng của lá này, không phải sự trưởng thành chỉ vì tuổi tác mà là sự trưởng thành đến từ việc đã đi qua đủ nhiều để biết cách xây dựng một cuộc sống vững chắc theo cách của riêng mình.",
    "quote": "Đây là giai đoạn của sự làm chủ và ổn định, nơi những nỗ lực trước đó bắt đầu kết trái thành một nền tảng vững chắc."
  }
];
