class_name FsmState
extends Node

## FsmState: Lớp cơ sở cho một trạng thái đơn lẻ trong Finite State Machine
## Được kế thừa bởi các trạng thái cụ thể của Quái vật hoặc Tháp phòng thủ.

@warning_ignore("unused_signal")
signal transitioned(new_state_name: String)

## Được gọi khi bắt đầu bước vào trạng thái
func enter() -> void:
	pass

## Được gọi khi rời khỏi trạng thái
func exit() -> void:
	pass

## Được gọi trong vòng lặp _process của Node cha
func update(_delta: float) -> void:
	pass

## Được gọi trong vòng lặp _physics_process của Node cha
func physics_update(_delta: float) -> void:
	pass
