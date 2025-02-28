package com.campforest.backend.chatting.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class CreateRoomDto {
	private Long productId;
	private Long seller;
}
