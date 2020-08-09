import React, { Component } from 'react';
import { PanResponder, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { DOWN_STATE, UP_STATE } from './BottomDrawer';

export default class Animator extends Component {
    state = {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
    };

    constructor(props) {
        super(props);

        this.position = new Animated.ValueXY(this.props.currentPosition);

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: this._handlePanResponderMove,
            onPanResponderRelease: this._handlePanResponderRelease
        });
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.drawerState !== this.props.drawerState ||
            prevProps.downPosition !== this.props.downPosition ||
            prevProps.upPosition !== this.props.upPosition
        ) {
            if (this.props.drawerState === 0) {
                this._transitionTo(this.props.downPosition, this.props.onCollapsed);
            }
            if (this.props.drawerState === 1) {
                this._transitionTo(this.props.upPosition, this.props.onExpanded);
            }
        }
    }

    render() {
        return (
            <Animated.View
                style={[
                    { ...this.position.getLayout(), left: 0 },
                    StyleSheet.flatten([
                        styles.animationContainer(this.props.containerHeight, this.props.backgroundColor, this.state.height, this.state.width),
                        styles.roundedEdges(this.props.roundedEdges),
                        styles.shadow(this.props.shadow)
                    ])
                ]}
                {...this._panResponder.panHandlers}>
                {this.props.children}
            </Animated.View>
        );
    }

    _handlePanResponderMove = (e, gesture) => {
        if (this._swipeInBounds(gesture)) {
            this.position.setValue({ y: this.props.currentPosition.y + gesture.dy });
        } else {
            this.position.setValue({ y: this.props.upPosition.y - this._calculateEase(gesture) });
        }
    };

    _handlePanResponderRelease = (e, gesture) => {
        if (gesture.dy > this.props.toggleThreshold && this.props.currentPosition === this.props.upPosition) {
            this._transitionTo(this.props.downPosition, this.props.onCollapsed);
            this.props.onDrawerStateSet(DOWN_STATE);
        } else if (gesture.dy < -this.props.toggleThreshold && this.props.currentPosition === this.props.downPosition) {
            this._transitionTo(this.props.upPosition, this.props.onExpanded);
            this.props.onDrawerStateSet(UP_STATE);
        } else {
            this._resetPosition();
        }
    };

    // returns true if the swipe is within the height of the drawer.
    _swipeInBounds(gesture) {
        return this.props.currentPosition.y + gesture.dy > this.props.upPosition.y;
    }

    _calculateEase(gesture) {
        return Math.min(Math.sqrt(gesture.dy * -1), Math.sqrt(this.state.height));
    }

    _transitionTo(position, callback) {
        if (position.y === 0) {
            Animated.timing(this.position, {
                toValue: position,
                duration: 300,
                easing: Easing.inOut(Easing.ease)
            }).start();
        } else {
            Animated.spring(this.position, {
                toValue: position
            }).start();
        }

        this.props.setCurrentPosition(position);
        callback();
    }

    _resetPosition() {
        Animated.spring(this.position, {
            toValue: this.props.currentPosition
        }).start();
    }
}

const styles = {
    animationContainer: (height, color, stateHeight, stateWidth) => ({
        width: stateWidth,
        position: 'absolute',
        height: height + Math.sqrt(stateHeight),
        backgroundColor: color
    }),
    roundedEdges: (rounded) => {
        return (
            rounded == true && {
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10
            }
        );
    },
    shadow: (shadow) => {
        return (
            shadow == true && {
                shadowColor: '#CECDCD',
                shadowRadius: 3,
                shadowOpacity: 5
            }
        );
    }
};
